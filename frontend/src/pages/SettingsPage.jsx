import React, { useEffect, useState } from "react";
import { Sliders, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";

export function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [fittingsPct, setFittingsPct] = useState("5.0");
  const [gstPct, setGstPct] = useState("5.0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settings");
      const list = res.data?.settings || [];
      setSettings(list);

      const f = list.find((s) => s.key === "FITTINGS_PERCENTAGE");
      if (f) setFittingsPct(f.value);

      const g = list.find((s) => s.key === "DEFAULT_GST_PERCENTAGE");
      if (g) setGstPct(g.value);
    } catch (err) {
      console.error("Failed to load business settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg("");
      setErrorMsg("");

      await Promise.all([
        api.put("/settings/FITTINGS_PERCENTAGE", {
          value: fittingsPct,
          description: "Configurable percentage applied to Net Items for Fittings amount calculation",
        }),
        api.put("/settings/DEFAULT_GST_PERCENTAGE", {
          value: gstPct,
          description: "Default standard GST percentage applicable to Taxable amount",
        }),
      ]);

      setSuccessMsg("Business settings saved and applied across billing workflows successfully!");
      fetchSettings();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update business settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Business Configuration & Rules"
        subtitle="Configure enterprise calculation percentages, tax policies, and default parameters"
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={fetchSettings}>
            Refresh
          </Button>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto max-w-4xl">
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[8px] flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center gap-2">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6">
            <SkeletonLoader rows={5} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-6">
            <div className="border-b border-[#EDEAE1] pb-4">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Sliders size={16} className="text-[#2F6F5E]" /> Commercial Billing Parameters
              </h3>
              <p className="text-xs text-[#52607D] mt-1">
                These settings drive direct sales calculations, quotation formulas, and tax breakdowns.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Default Fittings Percentage (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={fittingsPct}
                    onChange={(e) => setFittingsPct(e.target.value)}
                    className="w-32 px-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                    required
                  />
                  <span className="text-xs text-[#52607D]">
                    Formula: <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">fittings = net_item_amount * ({fittingsPct} / 100)</code>
                  </span>
                </div>
                <p className="text-[11px] text-[#8C97AB] mt-1">
                  Fittings are taxable but will not generate inventory reduction movements.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Standard GST Rate (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={gstPct}
                    onChange={(e) => setGstPct(e.target.value)}
                    className="w-32 px-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                    required
                  />
                  <span className="text-xs text-[#52607D]">
                    Applied on Taxable Amount (Net Items + Fittings)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#EDEAE1]">
              <Button type="submit" loading={saving} icon={Save}>
                Save
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default SettingsPage;
