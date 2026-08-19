import React, { useState, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  FileText,
  Boxes,
  ArrowRight,
  ExternalLink,
  Check,
  Plus,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function TallyImportPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState("");

  // Tally item mappings state
  const [itemsList, setItemsList] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [unmappedItems, setUnmappedItems] = useState([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [selectedItemMap, setSelectedItemMap] = useState({});
  const [savingMapping, setSavingMapping] = useState({});
  const [mappingSuccess, setMappingSuccess] = useState({});

  const fetchItemsAndMappings = async () => {
    try {
      setLoadingMappings(true);
      const [itemsRes, mapRes] = await Promise.all([
        api.get("/items?limit=500&is_active=true"),
        api.get("/tally/mappings"),
      ]);

      const items = itemsRes?.items || itemsRes?.data?.items || [];
      const mappingData = mapRes?.data || mapRes || {};
      setItemsList(items);
      setMappings(mappingData.mappings || []);
      setUnmappedItems(mappingData.unmappedItems || []);
    } catch (err) {
      console.error("Failed to load items and Tally mappings:", err);
    } finally {
      setLoadingMappings(false);
    }
  };

  useEffect(() => {
    fetchItemsAndMappings();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please select a Transactions.json file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/tally/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = res.data?.data || res.data || res || {};
      setUploadResult(result);
      fetchItemsAndMappings();
    } catch (err) {
      setUploadError(err.message || err.response?.data?.message || "Failed to import Tally file.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMapping = async (tallyItemName) => {
    const cheranItemId = selectedItemMap[tallyItemName];
    if (!cheranItemId) return;

    try {
      setSavingMapping((prev) => ({ ...prev, [tallyItemName]: true }));
      await api.post("/tally/mappings", {
        tally_item_name: tallyItemName,
        item_id: cheranItemId,
      });

      setMappingSuccess((prev) => ({ ...prev, [tallyItemName]: true }));
      setTimeout(() => {
        setMappingSuccess((prev) => ({ ...prev, [tallyItemName]: false }));
      }, 2500);

      fetchItemsAndMappings();
    } catch (err) {
      console.error("Failed to save mapping:", err);
    } finally {
      setSavingMapping((prev) => ({ ...prev, [tallyItemName]: false }));
    }
  };

  const handleCreateFinishedGood = async (tallyItemName) => {
    try {
      setSavingMapping((prev) => ({ ...prev, [tallyItemName]: true }));
      await api.post("/tally/create-item", {
        tally_item_name: tallyItemName,
        unit: "NOS",
      });

      setMappingSuccess((prev) => ({ ...prev, [tallyItemName]: true }));
      setTimeout(() => {
        setMappingSuccess((prev) => ({ ...prev, [tallyItemName]: false }));
      }, 2500);

      fetchItemsAndMappings();
    } catch (err) {
      console.error("Failed to create finished good item:", err);
    } finally {
      setSavingMapping((prev) => ({ ...prev, [tallyItemName]: false }));
    }
  };

  const finishedGoodOptions = itemsList
    .filter((i) => i.item_type === "FINISHED_GOOD")
    .map((i) => ({
      value: i.id,
      label: `${i.name} (${i.unit?.symbol || "NOS"})`,
    }));

  const allItemOptions = itemsList.map((i) => ({
    value: i.id,
    label: `${i.name} [${i.item_type}] (${i.unit?.symbol || "NOS"})`,
  }));

  const itemOptions = finishedGoodOptions.length > 0 ? finishedGoodOptions : allItemOptions;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAF8]">
      <Navbar
        title="Tally Sales Import"
        subtitle="Import Transactions.json to link Government Projects and track invoiced goods"
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={fetchItemsAndMappings}>
            Refresh Mappings
          </Button>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Upload Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-xs">
          <h2 className="text-sm font-bold text-[#14213D] mb-1 font-display">
            Upload Tally Export File (Transactions.json)
          </h2>
          <p className="text-xs text-[#52607D] mb-4">
            Upload your Tally JSON file. Government sales invoices will automatically link to existing projects or create new projects with initial status <strong>INVOICED</strong>. (Physical inventory remains unchanged).
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-[#E4E1D8] hover:border-[#2F6F5E] transition-colors rounded-[8px] p-6 text-center bg-[#FAFAF8]">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="tally-json-upload"
              />
              <label
                htmlFor="tally-json-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#EAF3F0] flex items-center justify-center text-[#2F6F5E]">
                  <Upload size={20} />
                </div>
                <div className="text-xs text-[#14213D] font-semibold">
                  {file ? file.name : "Click to select or drag & drop Transactions.json"}
                </div>
                <div className="text-[11px] text-[#8C97AB]">
                  Accepts Tally exported JSON documents (up to 50MB)
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              {file && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Clear File
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={Upload}
                loading={uploading}
                disabled={!file || uploading}
              >
                {uploading ? "Importing Tally Vouchers..." : "Import Government Sales"}
              </Button>
            </div>
          </form>
        </div>

        {/* Upload Results Summary (if just uploaded) */}
        {uploadResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F6F5E]">
                <CheckCircle size={15} />
                <span>Import Execution Summary</span>
              </div>
              {uploadResult.skippedInvoices > 0 && uploadResult.importedInvoices === 0 && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  All {uploadResult.skippedInvoices} government invoices already exist in database (0 duplicates created)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <MetricCard
                title="New Invoices Imported"
                value={uploadResult.importedInvoices}
                icon={CheckCircle}
                accentColor="#2F6F5E"
                description={`${uploadResult.importedInvoices + uploadResult.skippedInvoices} Govt invoices in file`}
              />
              <MetricCard
                title="New Projects Created"
                value={uploadResult.newProjects}
                icon={Layers}
                accentColor="#10B981"
                description="Status set to INVOICED"
              />
              <MetricCard
                title="Existing Projects Linked"
                value={uploadResult.existingProjectsLinked}
                icon={RefreshCw}
                accentColor="#2B5B84"
                description="Linked to existing records"
              />
              <MetricCard
                title="Finished Goods Auto-Created"
                value={uploadResult.autoCreatedItemsCount || 0}
                icon={Boxes}
                accentColor="#8B5CF6"
                description="Added to Item Master"
              />
              <MetricCard
                title="Duplicate Invoices Skipped"
                value={uploadResult.skippedInvoices}
                icon={FileText}
                accentColor="#D97706"
                description="Already in database"
              />
            </div>

            {uploadResult.autoCreatedItems && uploadResult.autoCreatedItems.length > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-[8px] text-xs text-purple-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes size={16} className="text-purple-600 shrink-0" />
                  <span>
                    <strong>{uploadResult.autoCreatedItems.length} Finished Good item(s)</strong> were automatically created and added to your Item Master & mapped.
                  </span>
                </div>
              </div>
            )}

            {/* Error Diagnostics Card (if any vouchers failed) */}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-[10px] space-y-2">
                <div className="flex items-center gap-2 text-rose-800 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle size={16} />
                  <span>{uploadResult.errors.length} Voucher(s) Failed During Import</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs text-rose-700 font-mono">
                  {uploadResult.errors.map((err, idx) => (
                    <div key={idx} className="p-1.5 bg-white/70 rounded border border-rose-200/50">
                      <strong>Voucher #{err.invoice_number || err.voucher_index}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Imported Invoices Table */}
            {uploadResult.importedInvoiceList && uploadResult.importedInvoiceList.length > 0 && (
              <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-xs">
                <h3 className="text-xs font-bold text-[#14213D] mb-3 uppercase tracking-wider">
                  Imported Invoices Batch ({uploadResult.importedInvoiceList.length})
                </h3>
                <div className="border border-[#EDEAE1] rounded-[8px] overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] font-semibold whitespace-nowrap">
                      <tr>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Invoice Date</th>
                        <th className="py-2.5 px-3">Government Project ID</th>
                        <th className="py-2.5 px-3">Project Status</th>
                        <th className="py-2.5 px-3 text-right">Items</th>
                        <th className="py-2.5 px-3 text-right">Net Subtotal</th>
                        <th className="py-2.5 px-3 text-right">GST Tax</th>
                        <th className="py-2.5 px-3 text-right">Rounding</th>
                        <th className="py-2.5 px-3 text-right">Grand Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1] text-[#14213D] whitespace-nowrap">
                      {uploadResult.importedInvoiceList.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-[#FAFAF8]">
                          <td className="py-2 px-3 font-mono font-bold text-[#2F6F5E]">
                            #{inv.invoice_number}
                          </td>
                          <td className="py-2 px-3 font-mono">{inv.invoice_date}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-[#14213D]">
                            {inv.project_id}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.is_new_project
                                  ? "bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/20"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {inv.is_new_project ? "NEW INVOICED" : "LINKED EXISTING"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{inv.item_count}</td>
                          <td className="py-2 px-3 text-right font-mono text-[#52607D]">
                            ₹{parseFloat(inv.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#2F6F5E]">
                            ₹{parseFloat(inv.tax_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[#52607D]">
                            ₹{parseFloat(inv.rounding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-[#14213D]">
                            ₹{parseFloat(inv.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tally Item Mapping Section */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#14213D] font-display">
                Tally Item → Cheran Item Master Mapping
              </h2>
              <p className="text-xs text-[#52607D]">
                Map Tally stock item names to Cheran finished goods. Future imports will automatically map to the selected item.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-[#2F6F5E] bg-[#EAF3F0] px-2.5 py-1 rounded-full">
              {mappings.length} Items Mapped
            </div>
          </div>

          {/* Unmapped Items Alert (if any) */}
          {unmappedItems.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[8px] text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>
                  <strong>{unmappedItems.length} Tally item(s)</strong> require mapping to Cheran Finished Goods below.
                </span>
              </div>
            </div>
          )}

          {loadingMappings ? (
            <SkeletonLoader rows={5} />
          ) : (
            <div className="space-y-4">
              {/* Unmapped Items Form Table */}
              {unmappedItems.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">
                    Action Required: Map Unmapped Tally Items
                  </h3>
                  <div className="border border-rose-200 rounded-[8px] overflow-hidden bg-rose-50/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-rose-50 border-b border-rose-200 text-rose-900 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Tally Stock Item Name</th>
                          <th className="py-2.5 px-3">Map to Existing Finished Good</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {unmappedItems.map((tName, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/50">
                            <td className="py-2.5 px-3 font-semibold text-[#14213D]">
                              {tName}
                            </td>
                            <td className="py-2.5 px-3 w-80">
                              <CustomSelect
                                options={itemOptions}
                                value={selectedItemMap[tName] || ""}
                                onChange={(val) =>
                                  setSelectedItemMap((prev) => ({ ...prev, [tName]: val }))
                                }
                                placeholder="Select Cheran Finished Good"
                                size="sm"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  icon={Plus}
                                  loading={savingMapping[tName]}
                                  disabled={savingMapping[tName]}
                                  onClick={() => handleCreateFinishedGood(tName)}
                                >
                                  Create as FG
                                </Button>
                                <Button
                                  size="xs"
                                  variant="primary"
                                  icon={mappingSuccess[tName] ? Check : ArrowRight}
                                  loading={savingMapping[tName]}
                                  disabled={!selectedItemMap[tName] || savingMapping[tName]}
                                  onClick={() => handleSaveMapping(tName)}
                                >
                                  {mappingSuccess[tName] ? "Saved!" : "Save Map"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Existing Mapped Items Table */}
              <div>
                <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider mb-2">
                  Active Tally Item Mappings ({mappings.length})
                </h3>
                {mappings.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#52607D] bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                    No item mappings configured yet. Upload a Tally file to discover and map items.
                  </div>
                ) : (
                  <div className="border border-[#EDEAE1] rounded-[8px] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Tally Item Name</th>
                          <th className="py-2.5 px-3">Cheran Item Master Match</th>
                          <th className="py-2.5 px-3">Item Type</th>
                          <th className="py-2.5 px-3">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                        {mappings.map((m) => (
                          <tr key={m.id} className="hover:bg-[#FAFAF8]">
                            <td className="py-2 px-3 font-semibold text-[#14213D]">
                              {m.tally_item_name}
                            </td>
                            <td className="py-2 px-3 font-bold text-[#2F6F5E]">
                              {m.item?.name || "—"}
                            </td>
                            <td className="py-2 px-3 text-[#52607D]">
                              {m.item?.item_type || "—"}
                            </td>
                            <td className="py-2 px-3 font-mono text-[#52607D]">
                              {m.item?.unit?.symbol || m.item?.unit?.name || "NOS"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TallyImportPage;
