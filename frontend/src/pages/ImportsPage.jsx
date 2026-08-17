import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Play,
  RotateCcw,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";

export function ImportsPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [stagedRows, setStagedRows] = useState([]);
  const [rowActionFilter, setRowActionFilter] = useState("ALL");
  const [committing, setCommitting] = useState(false);

  // Past Imports History
  const [pastImports, setPastImports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Dealer Resolution State
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [selectedRowForResolution, setSelectedRowForResolution] = useState(null);
  const [dealersList, setDealersList] = useState([]);
  const [resolutionMode, setResolutionMode] = useState("SELECT_EXISTING"); // or CREATE_NEW
  const [selectedExistingDealerId, setSelectedExistingDealerId] = useState("");
  const [newDealerName, setNewDealerName] = useState("");
  const [newDealerCommission, setNewDealerCommission] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchPastImports = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/government/imports?limit=10");
      setPastImports(res.data?.imports || []);
    } catch (err) {
      console.error("Error fetching past imports:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const res = await api.get("/dealers?limit=100");
      setDealersList(res.data?.dealers || []);
    } catch (err) {
      console.error("Failed to load dealers:", err);
    }
  };

  useEffect(() => {
    fetchPastImports();
    fetchDealers();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadPreview = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an Excel (.xls, .xlsx) file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", "Staff");

    try {
      setUploading(true);
      const res = await api.post("/government/imports/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPreviewData(res.data);
      toast.success("Excel parsed and preview staged successfully!");

      // Fetch all staged rows for this import
      const rowsRes = await api.get(`/government/imports/${res.data.importId}/rows?limit=100`);
      setStagedRows(rowsRes.data?.rows || []);
      fetchPastImports();
    } catch (err) {
      toast.error(err.message || "Failed to parse and preview Excel file");
    } finally {
      setUploading(false);
    }
  };

  const openDealerResolution = (row) => {
    setSelectedRowForResolution(row);
    setNewDealerName(row.dealer_name || "");
    setSelectedExistingDealerId("");
    setResolutionMode("SELECT_EXISTING");
    setResolutionModalOpen(true);
  };

  const handleResolveDealerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRowForResolution || !previewData?.importId) return;

    try {
      setResolving(true);
      const payload = {
        dealer_name: selectedRowForResolution.dealer_name,
        resolution_type: resolutionMode,
        ...(resolutionMode === "SELECT_EXISTING"
          ? { dealer_id: selectedExistingDealerId }
          : {
              new_dealer: {
                name: newDealerName,
                commission_percentage: newDealerCommission ? parseFloat(newDealerCommission) : null,
              },
            }),
      };

      await api.post(`/government/imports/${previewData.importId}/resolve-dealer`, payload);

      toast.success("Dealer resolved successfully!");
      setResolutionModalOpen(false);

      // Refresh staged rows & summary
      const rowsRes = await api.get(`/government/imports/${previewData.importId}/rows?limit=100`);
      setStagedRows(rowsRes.data?.rows || []);

      // Refresh import summary
      const importRes = await api.get(`/government/imports/${previewData.importId}`);
      if (importRes.data?.import) {
        setPreviewData((prev) => ({
          ...prev,
          summary: {
            ...prev.summary,
            dealerResolutionsRequired: importRes.data.import.dealer_resolutions_count,
          },
        }));
      }

      fetchDealers();
    } catch (err) {
      toast.error(err.message || "Failed to resolve dealer");
    } finally {
      setResolving(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData?.importId) return;

    if (previewData.summary?.dealerResolutionsRequired > 0) {
      toast.error("Please resolve all dealer mappings before committing.");
      return;
    }

    try {
      setCommitting(true);
      const res = await api.post(`/government/imports/${previewData.importId}/commit`);
      toast.success(
        `Import committed! Created ${res.data?.summary?.newProjectsCreated} new, updated ${res.data?.summary?.existingProjectsUpdated} projects.`
      );
      setPreviewData(null);
      setFile(null);
      setStagedRows([]);
      fetchPastImports();
    } catch (err) {
      toast.error(err.message || "Failed to commit import to production database");
    } finally {
      setCommitting(false);
    }
  };

  const filteredRows = stagedRows.filter((r) => {
    if (rowActionFilter === "ALL") return true;
    return r.action === rowActionFilter;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Government Excel Imports"
        subtitle="Safe, two-step idempotent Excel import with staged dealer verification"
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto">
        {/* Upload Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <h2 className="text-base font-bold font-display text-[#14213D] mb-2">
            Upload Tamil Nadu Government Excel Export
          </h2>
          <p className="text-xs text-[#52607D] mb-6">
            Supports both <code>.xls</code> and <code>.xlsx</code> formats. Application IDs are mapped deterministically.
          </p>

          <form onSubmit={handleUploadPreview} className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="w-full text-xs text-[#52607D] file:mr-4 file:py-2 file:px-4 file:rounded-[8px] file:border-0 file:text-xs file:font-semibold file:bg-[#EAF3F0] file:text-[#2F6F5E] hover:file:bg-[#D3E6E0] cursor-pointer"
              />
            </div>

            <Button type="submit" loading={uploading} disabled={!file} icon={UploadCloud}>
              Parse & Preview
            </Button>
          </form>
        </div>

        {/* Live Staged Preview Section */}
        {previewData && (
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-4">
              <div>
                <h3 className="text-base font-bold font-display text-[#14213D]">
                  Staged Import Preview ({previewData.fileName})
                </h3>
                <p className="text-xs text-[#52607D]">
                  SHA-256: <code className="font-mono text-[10px]">{previewData.fileHash.slice(0, 16)}...</code>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPreviewData(null);
                    setStagedRows([]);
                  }}
                  icon={RotateCcw}
                >
                  Discard
                </Button>

                <Button
                  size="sm"
                  loading={committing}
                  disabled={previewData.summary?.dealerResolutionsRequired > 0}
                  onClick={handleCommitImport}
                  icon={Play}
                >
                  Commit Import to Production
                </Button>
              </div>
            </div>

            {/* Preview Metric Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px]">
                <span className="text-[10px] uppercase font-bold text-[#52607D]">Total Rows</span>
                <div className="text-lg font-bold font-display text-[#14213D]">
                  {previewData.summary.totalRows}
                </div>
              </div>
              <div className="p-3 bg-[#EAF3F0] border border-[#D3E6E0] rounded-[8px]">
                <span className="text-[10px] uppercase font-bold text-[#2F6F5E]">New Projects</span>
                <div className="text-lg font-bold font-display text-[#2F6F5E]">
                  {previewData.summary.newProjects}
                </div>
              </div>
              <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px]">
                <span className="text-[10px] uppercase font-bold text-[#14213D]">Existing</span>
                <div className="text-lg font-bold font-display text-[#14213D]">
                  {previewData.summary.existingProjects}
                </div>
              </div>
              <div className="p-3 bg-[#FDF8EC] border border-[#F7E7C4] rounded-[8px]">
                <span className="text-[10px] uppercase font-bold text-[#B8860B]">Status Changes</span>
                <div className="text-lg font-bold font-display text-[#B8860B]">
                  {previewData.summary.statusChanges}
                </div>
              </div>
              <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px]">
                <span className="text-[10px] uppercase font-bold text-[#52607D]">Unchanged</span>
                <div className="text-lg font-bold font-display text-[#52607D]">
                  {previewData.summary.unchanged}
                </div>
              </div>
              <div className="p-3 bg-[#FDF2F1] border border-[#F8D7D5] rounded-[8px]">
                <span className="text-[10px] uppercase font-bold text-[#B0403A]">Duplicates</span>
                <div className="text-lg font-bold font-display text-[#B0403A]">
                  {previewData.summary.duplicateRows}
                </div>
              </div>
              <div className="p-3 bg-[#FDF8EC] border border-[#F7E7C4] rounded-[8px]">
                <span className="text-[10px] uppercase font-bold text-[#B8860B]">Dealer Needs Action</span>
                <div className="text-lg font-bold font-display text-[#B8860B]">
                  {previewData.summary.dealerResolutionsRequired}
                </div>
              </div>
            </div>

            {/* Filter Tabs for Staged Rows */}
            <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-2">
              <span className="text-xs font-semibold text-[#52607D] mr-2">Filter Rows:</span>
              {[
                { id: "ALL", label: "All Staged" },
                { id: "DEALER_RESOLUTION_REQUIRED", label: "Dealer Needs Action" },
                { id: "NEW_PROJECT", label: "New Projects" },
                { id: "STATUS_CHANGE", label: "Status Changes" },
                { id: "UNCHANGED", label: "Unchanged" },
                { id: "ERROR", label: "Errors" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRowActionFilter(tab.id)}
                  className={`text-xs px-2.5 py-1 rounded-[6px] font-medium transition-colors cursor-pointer ${
                    rowActionFilter === tab.id
                      ? "bg-[#2F6F5E] text-white"
                      : "bg-[#FAFAF8] text-[#52607D] hover:bg-[#EDEAE1]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Staged Rows Table */}
            <div className="overflow-x-auto border border-[#E4E1D8] rounded-[8px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Row #</th>
                    <th className="py-2.5 px-3">Application ID</th>
                    <th className="py-2.5 px-3">Imported Status</th>
                    <th className="py-2.5 px-3">Imported Dealer</th>
                    <th className="py-2.5 px-3">Staged Action</th>
                    <th className="py-2.5 px-3 text-right">Action Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {filteredRows.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FAFAF8]">
                      <td className="py-2.5 px-3 font-mono text-[#52607D]">{r.row_number}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#14213D]">
                        {r.application_id || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={r.imported_status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-[#14213D]">
                        {r.dealer_name || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.action === "NEW_PROJECT"
                              ? "bg-[#EAF3F0] text-[#2F6F5E]"
                              : r.action === "STATUS_CHANGE"
                              ? "bg-[#FDF8EC] text-[#B8860B]"
                              : r.action === "DEALER_RESOLUTION_REQUIRED"
                              ? "bg-[#FDF8EC] text-[#B8860B] border border-[#F7E7C4]"
                              : r.action === "UNCHANGED"
                              ? "bg-[#FAFAF8] text-[#52607D]"
                              : "bg-[#FDF2F1] text-[#B0403A]"
                          }`}
                        >
                          {r.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {r.action === "DEALER_RESOLUTION_REQUIRED" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openDealerResolution(r)}
                            icon={Users}
                          >
                            Resolve Dealer
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Past Imports Batch History */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
          <h2 className="text-base font-bold font-display text-[#14213D]">
            Recent Import Batches
          </h2>

          {loadingHistory ? (
            <SkeletonLoader rows={4} />
          ) : pastImports.length === 0 ? (
            <div className="text-xs text-[#52607D] py-6 text-center">
              No historical imports recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Uploaded At</th>
                    <th className="py-2.5 px-3 text-right">Total Rows</th>
                    <th className="py-2.5 px-3 text-right">New Projects</th>
                    <th className="py-2.5 px-3 text-right">Status Changes</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {pastImports.map((imp) => (
                    <tr key={imp.id} className="hover:bg-[#FAFAF8]">
                      <td className="py-2.5 px-3 font-semibold text-[#14213D]">{imp.file_name}</td>
                      <td className="py-2.5 px-3 text-[#52607D]">
                        {new Date(imp.uploaded_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#14213D]">
                        {imp.total_rows}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#2F6F5E] font-medium">
                        {imp.new_projects_count}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#B8860B] font-medium">
                        {imp.status_changes_count}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            imp.status === "COMPLETED"
                              ? "bg-[#EAF3F0] text-[#2F6F5E]"
                              : imp.status === "FAILED"
                              ? "bg-[#FDF2F1] text-[#B0403A]"
                              : "bg-[#FDF8EC] text-[#B8860B]"
                          }`}
                        >
                          {imp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Dealer Resolution Modal */}
      <Modal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        title="Resolve Unmatched Dealer"
      >
        <form onSubmit={handleResolveDealerSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px]">
            <span className="text-[#52607D]">Imported Dealer Name:</span>
            <p className="text-sm font-bold text-[#14213D] mt-0.5">
              {selectedRowForResolution?.dealer_name}
            </p>
          </div>

          <div className="flex border-b border-[#EDEAE1] gap-4">
            <button
              type="button"
              onClick={() => setResolutionMode("SELECT_EXISTING")}
              className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                resolutionMode === "SELECT_EXISTING"
                  ? "border-[#2F6F5E] text-[#2F6F5E]"
                  : "border-transparent text-[#52607D]"
              }`}
            >
              Map to Existing Dealer
            </button>
            <button
              type="button"
              onClick={() => setResolutionMode("CREATE_NEW")}
              className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                resolutionMode === "CREATE_NEW"
                  ? "border-[#2F6F5E] text-[#2F6F5E]"
                  : "border-transparent text-[#52607D]"
              }`}
            >
              Create New Dealer
            </button>
          </div>

          {resolutionMode === "SELECT_EXISTING" ? (
            <div className="space-y-2">
              <label className="font-semibold text-[#14213D]">Select Existing Registered Dealer:</label>
              <select
                value={selectedExistingDealerId}
                onChange={(e) => setSelectedExistingDealerId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E]"
              >
                <option value="">-- Choose a Dealer --</option>
                {dealersList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.commission_percentage ? `(${d.commission_percentage}%)` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-[#14213D]">Dealer Name *</label>
                <input
                  type="text"
                  value={newDealerName}
                  onChange={(e) => setNewDealerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-[#14213D]">Commission % (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10.0"
                  value={newDealerCommission}
                  onChange={(e) => setNewDealerCommission(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setResolutionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={resolving}>
              Confirm Mapping
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ImportsPage;
