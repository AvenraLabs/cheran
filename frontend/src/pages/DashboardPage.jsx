import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  TrendingUp,
  Clock,
  LandPlot,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Button from "../components/common/Button.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [durationStats, setDurationStats] = useState([]);
  const [recentImports, setRecentImports] = useState([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const [summaryRes, durationRes, importsRes] = await Promise.all([
          api.get("/government/projects/stats/status-summary"),
          api.get("/government/projects/stats/stage-durations"),
          api.get("/government/imports?limit=5"),
        ]);

        setSummaryData(summaryRes.data);
        setDurationStats(durationRes.data?.transitions || []);
        setRecentImports(importsRes.data?.imports || []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const totalArea = summaryData?.statusBreakdown?.reduce(
    (acc, s) => acc + (parseFloat(s.total_area_ha) || 0),
    0
  );
  const totalFunds = summaryData?.statusBreakdown?.reduce(
    (acc, s) => acc + (parseFloat(s.total_fund_released) || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Operations Dashboard"
        actions={
          <Link to="/imports">
            <Button icon={UploadCloud}>Import Govt Excel</Button>
          </Link>
        }
      />

      <main className="p-8 space-y-8 flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonLoader rows={6} />
        ) : (
          <>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="Total Govt Projects"
                value={summaryData?.totalProjects?.toLocaleString() || "0"}
                subtitle="Tracked in system"
                icon={FileSpreadsheet}
              />
              <MetricCard
                title="Total Extent Area"
                value={`${(totalArea || 0).toFixed(2)} Ha`}
                subtitle="Covered under MI schemes"
                icon={LandPlot}
              />
              <MetricCard
                title="Total Funds Released"
                value={`₹${(totalFunds || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                subtitle="Across verified stages"
                icon={TrendingUp}
              />
              <MetricCard
                title="Recent Imports"
                value={recentImports.length}
                subtitle="Batches processed"
                icon={UploadCloud}
              />
            </div>

            {/* Middle Section: Status Breakdown & Transition Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Status Breakdown */}
              <div className="lg:col-span-2 bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold font-display text-[#14213D]">
                    Current Status Distribution
                  </h2>
                  <Link
                    to="/projects"
                    className="text-xs font-semibold text-[#2F6F5E] hover:underline inline-flex items-center gap-1"
                  >
                    View Projects <ArrowRight size={14} />
                  </Link>
                </div>

                {summaryData?.statusBreakdown?.length === 0 ? (
                  <div className="text-xs text-[#52607D] py-8 text-center">
                    No government project data imported yet. Upload an Excel to begin.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#EDEAE1] text-[#52607D] uppercase font-semibold">
                          <th className="pb-3">Government Status</th>
                          <th className="pb-3 text-right">Projects</th>
                          <th className="pb-3 text-right">Share</th>
                          <th className="pb-3 text-right">Area (Ha)</th>
                          <th className="pb-3 text-right">Funds Released</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {summaryData?.statusBreakdown?.map((item) => (
                          <tr key={item.status} className="hover:bg-[#FAFAF8]">
                            <td className="py-2.5 pr-2">
                              <StatusBadge status={item.status} size="sm" />
                            </td>
                            <td className="py-2.5 text-right font-medium text-[#14213D]">
                              {item.count}
                            </td>
                            <td className="py-2.5 text-right text-[#52607D]">
                              {item.percentage}%
                            </td>
                            <td className="py-2.5 text-right text-[#14213D]">
                              {item.total_area_ha}
                            </td>
                            <td className="py-2.5 text-right font-medium text-[#2F6F5E]">
                              ₹{parseFloat(item.total_fund_released || 0).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Stage Transition Durations */}
              <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={18} className="text-[#2F6F5E]" />
                  <h2 className="text-base font-bold font-display text-[#14213D]">
                    Observed Stage Durations
                  </h2>
                </div>

                {durationStats.length === 0 ? (
                  <div className="text-xs text-[#52607D] py-8 text-center">
                    Transition duration metrics will populate automatically as multiple periodic Excel exports are uploaded over time.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {durationStats.slice(0, 6).map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] space-y-1.5"
                      >
                        <div className="text-[11px] font-medium text-[#52607D] flex items-center justify-between">
                          <span className="truncate max-w-[120px]">{t.from_status}</span>
                          <span className="text-[#2F6F5E] font-bold">→</span>
                          <span className="truncate max-w-[120px]">{t.to_status}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EDEAE1]">
                          <span className="text-[#52607D]">
                            {t.transition_count} project{t.transition_count > 1 ? "s" : ""}
                          </span>
                          <span className="font-bold text-[#14213D]">
                            Avg: {t.avg_days} days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
