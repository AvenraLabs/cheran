import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  TrendingUp,
  Clock,
  LandPlot,
  ArrowRight,
  UploadCloud,
  Users,
  MapPin,
  RefreshCw,
  Layers,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedDealer, setSelectedDealer] = useState("");

  // Filter options
  const [yearsList, setYearsList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [dealersList, setDealersList] = useState([]);

  // API Data States
  const [summaryData, setSummaryData] = useState(null);
  const [statusDistData, setStatusDistData] = useState([]);
  const [dealerDistData, setDealerDistData] = useState([]);
  const [districtDistData, setDistrictDistData] = useState([]);
  const [stageDurationsData, setStageDurationsData] = useState([]);
  const [financialOverview, setFinancialOverview] = useState(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const params = {
        ...(selectedYear ? { year: selectedYear } : {}),
        ...(selectedDistrict ? { district: selectedDistrict } : {}),
        ...(selectedDealer ? { dealer_id: selectedDealer } : {}),
      };

      const [summaryRes, allDealersRes, durationsRes] = await Promise.all([
        api.get("/dashboard/government/summary", { params }),
        api.get("/dealers/options").catch(() => ({ dealers: [] })),
        api.get("/dashboard/government/stage-durations", { params }).catch(() => ({ data: { stageDurations: [] } })),
      ]);

      const summary = summaryRes?.data || summaryRes || {};
      setSummaryData(summary);
      setStatusDistData(summary.byStatus || []);
      setDealerDistData(summary.byDealer || []);
      setDistrictDistData(summary.byDistrict || []);
      setDealersList(allDealersRes?.data?.dealers || allDealersRes?.dealers || []);
      setStageDurationsData(durationsRes?.data?.stageDurations || durationsRes?.stageDurations || []);

      if (summary.availableYears?.length > 0) {
        setYearsList(summary.availableYears);
      }

      // Extract unique districts if not already populated
      if (summary.byDistrict?.length > 0 && districtsList.length === 0) {
        setDistrictsList(summary.byDistrict.map((d) => d.district).filter(Boolean));
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedDistrict, selectedDealer]);

  const availableYearOptions = [
    { value: "", label: "All Financial Years" },
    ...yearsList.map((y) => ({ value: y, label: y })),
  ];

  const totalExtentArea =
    summaryData?.totalAreaHa !== undefined && summaryData?.totalAreaHa !== null
      ? parseFloat(summaryData.totalAreaHa) || 0
      : statusDistData.reduce((acc, curr) => acc + (parseFloat(curr.totalAreaHa) || 0), 0);

  const totalFundsReleased =
    summaryData?.totalFundsReleased !== undefined && summaryData?.totalFundsReleased !== null
      ? parseFloat(summaryData.totalFundsReleased) || 0
      : statusDistData.reduce((acc, curr) => acc + (parseFloat(curr.totalFundReleased) || 0), 0);

  const totalInvoiceSum =
    summaryData?.totalInvoiceAmount !== undefined && summaryData?.totalInvoiceAmount !== null
      ? parseFloat(summaryData.totalInvoiceAmount) || 0
      : statusDistData.reduce((acc, curr) => acc + (parseFloat(curr.totalInvoiceAmount) || 0), 0);

  const completedProjects =
    (summaryData?.totalProjects || 0) - (summaryData?.pendingProjects || 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Operations Dashboard & Analytics"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchDashboardData(true)}
            >
              Refresh
            </Button>
            <Link to="/imports">
              <Button icon={UploadCloud}>Import</Button>
            </Link>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto">
        {/* Dynamic Filter Strip */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <span className="text-xs font-semibold text-[#52607D]">Filter:</span>

            {/* Year Selector */}
            <div className="w-44">
              <CustomSelect
                options={availableYearOptions}
                value={selectedYear}
                onChange={(val) => setSelectedYear(val)}
                placeholder="All Financial Years"
                size="sm"
                searchable={true}
              />
            </div>

            {/* District Selector */}
            <div className="w-44">
              <CustomSelect
                options={[
                  { value: "", label: "All Districts" },
                  ...districtsList.map((d) => ({ value: d, label: d })),
                ]}
                value={selectedDistrict}
                onChange={(val) => setSelectedDistrict(val)}
                placeholder="All Districts"
                size="sm"
                searchable={true}
              />
            </div>

            {/* Dealer Selector */}
            <div className="w-48">
              <CustomSelect
                options={[
                  { value: "", label: "All Dealers" },
                  ...dealersList.map((d) => ({ value: d.id, label: d.name })),
                ]}
                value={selectedDealer}
                onChange={(val) => setSelectedDealer(val)}
                placeholder="All Dealers"
                size="sm"
                searchable={true}
              />
            </div>

            {(selectedYear || selectedDistrict || selectedDealer) && (
              <button
                onClick={() => {
                  setSelectedYear("");
                  setSelectedDistrict("");
                  setSelectedDealer("");
                }}
                className="text-xs text-[#2F6F5E] hover:underline font-semibold cursor-pointer px-1 py-1"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="text-xs text-[#52607D] shrink-0">
            Total Tracked:{" "}
            <strong className="text-[#14213D] font-mono">
              {(summaryData?.totalProjects || 0).toLocaleString()}
            </strong>{" "}
            Projects
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <SkeletonLoader rows={6} />
          </div>
        ) : (
          <>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="Total Govt Projects"
                value={(summaryData?.totalProjects || 0).toLocaleString()}
                subtitle={`${(completedProjects || 0).toLocaleString()} finalized / ${(summaryData?.pendingProjects || 0).toLocaleString()} in progress`}
                icon={FileSpreadsheet}
              />
              <MetricCard
                title="Total Extent Area"
                value={`${totalExtentArea.toFixed(2)} Ha`}
                subtitle="Covered under micro-irrigation"
                icon={LandPlot}
              />
              <MetricCard
                title="Total Funds Released"
                value={`₹${(totalFundsReleased || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                subtitle="Government subsidy credited"
                icon={TrendingUp}
              />
              <MetricCard
                title="Total Invoice Value"
                value={`₹${(totalInvoiceSum || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                subtitle="Across verified applications"
                icon={IndianRupee}
              />
            </div>

            {/* Executive Financial Flow & Milestones Banner */}
            {financialOverview && (
              <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                      <TrendingUp size={18} className="text-[#2F6F5E]" />
                      <span>Executive Cash Flow & Fund Milestones</span>
                    </h3>
                    <p className="text-xs text-[#52607D] mt-0.5">
                      Government 55% / 45% Fund Milestones Inflow vs Raw Materials & Company Cost Outflows
                    </p>
                  </div>

                  <Link
                    to="/reports"
                    className="text-xs font-semibold text-[#2F6F5E] hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    Full Reports & P&L <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-emerald-50/70 p-3.5 rounded-[10px] border border-emerald-200">
                    <div className="text-[11px] font-semibold text-emerald-900">Govt 1st Fund (55%)</div>
                    <div className="text-base font-extrabold font-mono text-emerald-950 mt-0.5">
                      ₹{financialOverview.inflows.govt_first_fund_55_pct.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-emerald-800 mt-0.5">1st Fund Credited</div>
                  </div>

                  <div className="bg-blue-50/70 p-3.5 rounded-[10px] border border-blue-200">
                    <div className="text-[11px] font-semibold text-blue-900">Govt Final Fund (45%)</div>
                    <div className="text-base font-extrabold font-mono text-blue-950 mt-0.5">
                      ₹{financialOverview.inflows.govt_second_fund_45_pct.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-blue-800 mt-0.5">Final Fund Credited</div>
                  </div>

                  <div className="bg-rose-50/70 p-3.5 rounded-[10px] border border-rose-200">
                    <div className="text-[11px] font-semibold text-rose-900">Raw Material Purchases</div>
                    <div className="text-base font-extrabold font-mono text-rose-950 mt-0.5">
                      ₹{financialOverview.outflows.raw_materials_procurement.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-rose-800 mt-0.5">Procurement Spend</div>
                  </div>

                  <div className="bg-[#2F6F5E] p-3.5 rounded-[10px] text-white shadow-xs">
                    <div className="text-[11px] font-semibold text-white/80">Net Cash Position</div>
                    <div className="text-base font-extrabold font-mono text-white mt-0.5">
                      ₹{financialOverview.net_operating_cash_position.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-white/70 mt-0.5">Inflow - All Outflows</div>
                  </div>
                </div>
              </div>
            )}

            {/* Middle Section: Status Distribution & Observed Stage Durations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Status Breakdown Table (2 cols) */}
              <div className="lg:col-span-2 bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
                <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
                  <div>
                    <h2 className="text-base font-bold font-display text-[#14213D]">
                      Current Status Distribution
                    </h2>
                  </div>

                  <Link
                    to="/projects"
                    className="text-xs font-semibold text-[#2F6F5E] hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    View All <ArrowRight size={14} />
                  </Link>
                </div>

                {statusDistData.length === 0 ? (
                  <EmptyState
                    title="No project records found"
                    description="Upload an Excel import to view live status distributions."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Government Status</th>
                          <th className="py-2.5 px-3 text-right">Projects</th>
                          <th className="py-2.5 px-3 text-right">Share</th>
                          <th className="py-2.5 px-3 text-right">Area (Ha)</th>
                          <th className="py-2.5 px-3 text-right">Funds Released</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {statusDistData.map((item) => (
                          <tr key={item.status} className="hover:bg-[#FAFAF8]">
                            <td className="py-2.5 px-3">
                              <StatusBadge status={item.status} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium font-mono text-[#14213D]">
                              {(item.count || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                              {item.percentage}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#14213D]">
                              {item.totalAreaHa ? `${item.totalAreaHa.toFixed(2)} Ha` : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium font-mono text-[#2F6F5E]">
                              {(item.totalFundReleased || 0) > 0
                                ? `₹${(item.totalFundReleased || 0).toLocaleString("en-IN")}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Core Milestone Stage Durations (1 col) */}
              <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
                  <Clock size={18} className="text-[#2F6F5E]" />
                  <div>
                    <h2 className="text-base font-bold font-display text-[#14213D]">
                      Stage Transition Speeds
                    </h2>
                    <p className="text-[11px] text-[#52607D]">Core Company & Dealer Performance Milestones</p>
                  </div>
                </div>

                {stageDurationsData.length === 0 ? (
                  <div className="p-4 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] text-xs text-[#52607D] text-center space-y-2">
                    <AlertCircle size={24} className="text-[#B8860B] mx-auto opacity-70" />
                    <p>No transition records observed for the selected filter.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {stageDurationsData.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[10px] space-y-2 hover:border-[#2F6F5E]/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-[#14213D] leading-snug">
                              {t.stage_label || `${t.from_status} → ${t.to_status}`}
                            </div>
                            {t.sub_label && (
                              <div className="text-[10px] text-[#52607D] font-medium mt-0.5">
                                {t.sub_label}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 font-mono">
                            M{idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#EDEAE1]">
                          <span className="text-[11px] font-mono text-[#52607D]">
                            <strong className="text-[#14213D]">{t.count}</strong> projects
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-xs font-mono text-[#2F6F5E]">
                              Avg: {t.averageDays} days
                            </span>
                            <div className="text-[10px] font-mono text-[#8C97AB]">
                              (Min: {t.minDays}d · Max: {t.maxDays}d)
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Dealer & District Distributions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Dealer Distribution Card */}
              <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
                <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-[#2F6F5E]" />
                    <h2 className="text-base font-bold font-display text-[#14213D]">
                      Dealer Performance & Share
                    </h2>
                  </div>

                  <Link
                    to="/dealers"
                    className="text-xs font-semibold text-[#2F6F5E] hover:underline inline-flex items-center gap-1"
                  >
                    Manage Dealers <ArrowRight size={14} />
                  </Link>
                </div>

                {dealerDistData.length === 0 ? (
                  <div className="text-xs text-[#52607D] py-6 text-center">
                    No dealer mapping data available.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Dealer Firm</th>
                          <th className="py-2.5 px-3 text-right">Projects</th>
                          <th className="py-2.5 px-3 text-right">Share</th>
                          <th className="py-2.5 px-3 text-right">Subsidy Value</th>
                          <th className="py-2.5 px-3 text-right">Funds Released</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {dealerDistData.slice(0, 8).map((d, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFAF8]">
                            <td className="py-2.5 px-3 font-medium text-[#14213D]">
                              {d.dealer_name}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-[#14213D]">
                              {(d.count || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                              {d.percentage}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#14213D]">
                              {(d.totalSubsidyAmount || 0) > 0
                                ? `₹${(d.totalSubsidyAmount || 0).toLocaleString("en-IN")}`
                                : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-[#2F6F5E]">
                              {(d.totalFundReleased || 0) > 0
                                ? `₹${(d.totalFundReleased || 0).toLocaleString("en-IN")}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* District Distribution Card */}
              <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
                <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-[#2F6F5E]" />
                    <h2 className="text-base font-bold font-display text-[#14213D]">
                      Geographic District Coverage
                    </h2>
                  </div>
                </div>

                {districtDistData.length === 0 ? (
                  <div className="text-xs text-[#52607D] py-6 text-center">
                    No district data recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">District</th>
                          <th className="py-2.5 px-3 text-right">Projects</th>
                          <th className="py-2.5 px-3 text-right">Share</th>
                          <th className="py-2.5 px-3 text-right">Total Extent Area</th>
                          <th className="py-2.5 px-3 text-right">Funds Released</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {districtDistData.slice(0, 8).map((d, idx) => (
                          <tr key={idx} className="hover:bg-[#FAFAF8]">
                            <td className="py-2.5 px-3 font-semibold text-[#14213D]">
                              {d.district}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-[#14213D]">
                              {(d.count || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                              {d.percentage}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#14213D]">
                              {d.totalAreaHa ? `${d.totalAreaHa.toFixed(2)} Ha` : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-[#2F6F5E]">
                              {(d.totalFundReleased || 0) > 0
                                ? `₹${(d.totalFundReleased || 0).toLocaleString("en-IN")}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
