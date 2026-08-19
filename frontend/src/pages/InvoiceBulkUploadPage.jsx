import React, { useState } from "react";
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRight,
  Database,
  Calendar,
  Check,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";

export function InvoiceBulkUploadPage() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parsingError, setParsingError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [commitError, setCommitError] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setParsingError("");
    setUploadResult(null);
    setCommitError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const json = JSON.parse(text);

        let records = [];
        if (Array.isArray(json)) {
          records = json;
        } else if (json && Array.isArray(json.records)) {
          records = json.records;
        } else if (json && Array.isArray(json.data)) {
          records = json.data;
        } else {
          throw new Error("Invalid JSON structure. Expected an array or an object with a 'records' array.");
        }

        if (records.length === 0) {
          throw new Error("JSON file contains 0 records.");
        }

        setParsedData({
          source: json.source || selected.name,
          description: json.description || "Historical Government Invoice baseline import",
          recordsCount: records.length,
          sample: records.slice(0, 10),
          rawJson: json,
        });
      } catch (err) {
        setParsingError(`Failed to read JSON file: ${err.message}`);
        setParsedData(null);
      }
    };
    reader.readAsText(selected);
  };

  const handleCommit = async () => {
    if (!parsedData?.rawJson) return;

    try {
      setUploading(true);
      setCommitError("");

      const res = await api.post("/invoices/historical-json", parsedData.rawJson);
      setUploadResult(res.data || res);
    } catch (err) {
      console.error("Bulk upload commit error:", err);
      setCommitError(err.response?.data?.message || err.message || "Failed to commit historical invoice JSON.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setParsingError("");
    setUploadResult(null);
    setCommitError("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Invoice Bulk Upload"
        subtitle="Import historical Government Project invoice records & establish INVOICED baseline dates"
        actions={
          parsedData && (
            <Button variant="secondary" icon={RefreshCw} onClick={handleReset}>
              Reset
            </Button>
          )
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Upload Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
            <FileJson size={18} className="text-[#2F6F5E]" />
            <h2 className="text-sm font-bold font-display text-[#14213D]">
              Select Historical Invoice JSON (`invoice.json`)
            </h2>
          </div>

          <div className="border-2 border-dashed border-[#CCD0DC] hover:border-[#2F6F5E] bg-[#FAFAF8] rounded-[8px] p-6 sm:p-8 text-center transition-colors">
            <input
              type="file"
              id="invoice-json-file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="invoice-json-file"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-[#EAF3F0] flex items-center justify-center text-[#2F6F5E]">
                <Upload size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#14213D] hover:underline">
                  {file ? file.name : "Click to select or drag & drop invoice.json"}
                </span>
                <p className="text-[11px] text-[#52607D]">
                  Supports 5,000+ historical government invoice records extracted from Tally
                </p>
              </div>
            </label>
          </div>

          {parsingError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{parsingError}</span>
            </div>
          )}

          {commitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{commitError}</span>
            </div>
          )}
        </div>

        {/* Upload Success Metrics */}
        {uploadResult && (
          <div className="bg-white border border-[#2F6F5E]/30 rounded-[10px] p-6 shadow-sm space-y-5 bg-[#FAFAF8]/50">
            <div className="flex items-center gap-2.5 text-[#2F6F5E]">
              <CheckCircle2 size={22} />
              <div>
                <h3 className="text-sm font-bold text-[#14213D]">
                  Historical Invoices Successfully Imported!
                </h3>
                <p className="text-xs text-[#52607D]">
                  Government Project INVOICED baseline records and timeline history have been established.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard
                title="Total Records"
                value={uploadResult.data?.totalRecords || uploadResult.totalRecords || 0}
                subtitle="JSON records parsed"
                icon={FileJson}
              />
              <MetricCard
                title="Unique Projects"
                value={uploadResult.data?.uniqueProjectsCount || uploadResult.uniqueProjectsCount || 0}
                subtitle="Deduplicated IDs"
                icon={Database}
              />
              <MetricCard
                title="New Projects Created"
                value={uploadResult.data?.newProjectsCreated || uploadResult.newProjectsCreated || 0}
                subtitle="Status = INVOICED"
                icon={Layers}
              />
              <MetricCard
                title="Existing Projects Linked"
                value={uploadResult.data?.existingProjectsLinked || uploadResult.existingProjectsLinked || 0}
                subtitle="History baseline updated"
                icon={Check}
              />
            </div>
          </div>
        )}

        {/* Preview of Parsed Records */}
        {parsedData && !uploadResult && (
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-4">
              <div>
                <h3 className="text-sm font-bold font-display text-[#14213D]">
                  File Preview: {parsedData.recordsCount.toLocaleString()} Records Detected
                </h3>
                <p className="text-xs text-[#52607D]">
                  Source: {parsedData.source} · Sample records shown below
                </p>
              </div>

              <Button
                variant="primary"
                icon={uploading ? RefreshCw : ArrowRight}
                loading={uploading}
                onClick={handleCommit}
              >
                Commit {parsedData.recordsCount.toLocaleString()} Records
              </Button>
            </div>

            {/* Sample Table */}
            <div className="border border-[#EDEAE1] rounded-[8px] overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDEAE1] bg-[#FAFAF8] text-[#52607D] font-semibold">
                    <th className="py-2.5 px-4 w-16">#</th>
                    <th className="py-2.5 px-4">Government Application / Project ID</th>
                    <th className="py-2.5 px-4">Invoice / INVOICED Date</th>
                    <th className="py-2.5 px-4 text-right">Target Baseline Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1] font-mono">
                  {parsedData.sample.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAF8]">
                      <td className="py-2.5 px-4 text-[#8C97AB] font-sans">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-[#14213D]">
                        {row.government_project_id || row.application_id || row.project_id}
                      </td>
                      <td className="py-2.5 px-4 text-[#2F6F5E]">
                        {row.invoice_date || row.date}
                      </td>
                      <td className="py-2.5 px-4 text-right font-sans">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF3F0] text-[#2F6F5E]">
                          INVOICED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {parsedData.recordsCount > 10 && (
              <p className="text-[11px] text-center text-[#8C97AB]">
                Showing first 10 of {parsedData.recordsCount.toLocaleString()} records.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default InvoiceBulkUploadPage;
