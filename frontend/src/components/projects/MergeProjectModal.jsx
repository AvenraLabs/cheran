import React, { useState, useEffect, useRef } from "react";
import { Search, GitMerge, Edit3, Check, AlertCircle, User, MapPin, Tag, Calendar, FileText } from "lucide-react";
import api from "../../api/client.js";
import Modal from "../common/Modal.jsx";
import Button from "../common/Button.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import { formatDate } from "../../utils/dates.js";

export function MergeProjectModal({ isOpen, onClose, sourceProject, onSuccess }) {
  const [targetId, setTargetId] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [matchedTarget, setMatchedTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen && sourceProject) {
      setTargetId(sourceProject.application_id || "");
      setMatchedTarget(null);
      setSearchResults([]);
      setError("");
    }
  }, [isOpen, sourceProject]);

  // Live autocomplete search as user types
  useEffect(() => {
    if (!isOpen || !targetId || !targetId.trim()) {
      setSearchResults([]);
      setMatchedTarget(null);
      return;
    }

    const cleanInput = targetId.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get("/government/projects/search", {
          params: { query: cleanInput, limit: 6 },
        });

        const results = (res.data?.data || []).filter((p) => p.id !== sourceProject?.id);
        setSearchResults(results);

        // Check if there is an exact case-insensitive match for the target ID
        const exact = results.find(
          (p) => p.application_id?.trim().toUpperCase() === cleanInput.toUpperCase()
        );
        setMatchedTarget(exact || null);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [targetId, isOpen, sourceProject]);

  const handleSelectResult = (proj) => {
    setTargetId(proj.application_id);
    setMatchedTarget(proj);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId || !targetId.trim()) {
      setError("Please enter a valid Application ID");
      return;
    }

    if (targetId.trim().toUpperCase() === sourceProject?.application_id?.trim().toUpperCase()) {
      setError("Target Application ID must be different from current ID");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await api.post(`/government/projects/${sourceProject.id}/merge`, {
        target_application_id: targetId.trim(),
      });

      if (onSuccess) {
        onSuccess(res.data?.data || res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update / merge project");
    } finally {
      setSubmitting(false);
    }
  };

  if (!sourceProject) return null;

  const isOrphan = !sourceProject.farmer_name || sourceProject.farmer_name.trim() === "";
  const isMergeMode = Boolean(matchedTarget);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isMergeMode ? "Merge Duplicate Application Record" : "Correct / Rename Application ID"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-[8px] flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Source Project Information Card */}
        <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] space-y-2">
          <div className="text-[10px] text-[#52607D] uppercase font-bold tracking-wider">
            Current Record to Correct
          </div>
          <div className="flex items-center justify-between">
            <div className="font-mono font-bold text-[#14213D] text-sm">
              {sourceProject.application_id}
            </div>
            {isOrphan ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Orphan Invoice Record
              </span>
            ) : (
              <span className="text-[#52607D] font-medium">
                Farmer: <strong className="text-[#14213D]">{sourceProject.farmer_name}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] border-t border-[#EDEAE1]">
            <div>
              <span className="text-[#52607D]">Invoice #: </span>
              <strong className="text-[#14213D] font-mono">{sourceProject.invoice_number || "—"}</strong>
            </div>
            <div>
              <span className="text-[#52607D]">Invoice Date: </span>
              <strong className="text-[#14213D] font-mono">{formatDate(sourceProject.invoice_date) || "—"}</strong>
            </div>
            <div>
              <span className="text-[#52607D]">Status: </span>
              <strong className="text-[#14213D]">{sourceProject.current_status || "INVOICED"}</strong>
            </div>
          </div>
        </div>

        {/* Target Input with Search & Suggestions */}
        <div className="space-y-1.5 relative">
          <label className="block text-xs font-semibold text-[#14213D]">
            Enter Correct Target Government Application ID <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. H-ERD-Gpm-5279677841-2022-23"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
            {searching && (
              <span className="absolute right-3 top-2.5 text-[10px] text-[#52607D] animate-pulse font-sans">
                Searching existing projects...
              </span>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#E4E1D8] rounded-[8px] shadow-lg max-h-48 overflow-y-auto divide-y divide-[#EDEAE1]">
              <div className="p-2 text-[10px] uppercase font-bold text-[#52607D] bg-[#FAFAF8]">
                Matching Government Projects in Database:
              </div>
              {searchResults.map((res) => (
                <button
                  type="button"
                  key={res.id}
                  onClick={() => handleSelectResult(res)}
                  className="w-full p-2 text-left hover:bg-[#F4F2EB] transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-[#14213D]">{res.application_id}</div>
                    <div className="text-[11px] text-[#52607D]">
                      {res.farmer_name ? `${res.farmer_name} • ${[res.village, res.district].filter(Boolean).join(", ")}` : "No farmer profile"}
                    </div>
                  </div>
                  <StatusBadge status={res.current_status} size="sm" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Mode Confirmation Box */}
        {isMergeMode ? (
          <div className="p-3.5 bg-[#EAF3F0] border border-[#2F6F5E]/30 rounded-[8px] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#2F6F5E]">
              <GitMerge size={15} />
              <span>Target Project Found in Database: Merge Mode</span>
            </div>

            <div className="bg-white p-3 rounded-[6px] border border-[#2F6F5E]/20 space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#52607D]">Target Farmer:</span>
                <strong className="text-[#14213D]">{matchedTarget.farmer_name || "—"}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#52607D]">Location:</span>
                <span className="text-[#14213D]">{[matchedTarget.village, matchedTarget.district].filter(Boolean).join(", ") || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#52607D]">Current Status:</span>
                <StatusBadge status={matchedTarget.current_status} size="sm" />
              </div>
              {matchedTarget.quotation_subsidy_amount && (
                <div className="flex justify-between items-center">
                  <span className="text-[#52607D]">Subsidy Value:</span>
                  <strong className="text-[#14213D] font-mono">
                    ₹{parseFloat(matchedTarget.quotation_subsidy_amount).toLocaleString("en-IN")}
                  </strong>
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#2F6F5E] space-y-0.5">
              <div>✓ Will transfer <strong>Invoice #{sourceProject.invoice_number || "—"}</strong> & Date (<strong>{formatDate(sourceProject.invoice_date)}</strong>) to the target project.</div>
              <div>✓ Will record <strong>INVOICED</strong> status in target project history and recalculate commission.</div>
              <div>✓ Will safely delete this duplicate orphan record.</div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-[8px] text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Edit3 size={14} />
              <span>No duplicate found: Rename Mode</span>
            </div>
            <p className="text-[11px] text-blue-800">
              Application ID will simply be updated to <strong>{targetId || "the entered ID"}</strong>.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={submitting}
            icon={isMergeMode ? GitMerge : Check}
            variant={isMergeMode ? "primary" : "primary"}
          >
            {isMergeMode ? "Merge & Transfer Invoice" : "Rename Application ID"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default MergeProjectModal;
