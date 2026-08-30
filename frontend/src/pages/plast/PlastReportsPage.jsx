import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Boxes,
  Factory,
  RefreshCw,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

export function PlastReportsPage() {
  const [activeTab, setActiveTab] = useState("sales"); // sales | purchases | production | stock
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Filters
  const [datePreset, setDatePreset] = useState("THIS_MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Set date ranges automatically on preset change
  useEffect(() => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split("T")[0];

    if (datePreset === "TODAY") {
      setFromDate(formatDate(today));
      setToDate(formatDate(today));
    } else if (datePreset === "THIS_WEEK") {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
    } else if (datePreset === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
    } else if (datePreset === "ALL") {
      setFromDate("");
      setToDate("");
    }
  }, [datePreset]);

  const loadFilterOptions = async () => {
    try {
      const [custs, sups] = await Promise.all([
        plastApi.getCustomers(),
        plastApi.getSuppliers(),
      ]);
      setCustomers(Array.isArray(custs) ? custs : custs?.data || []);
      setSuppliers(Array.isArray(sups) ? sups : sups?.data || []);
    } catch (err) {
      setCustomers([]);
      setSuppliers([]);
    }
  };

  const fetchReport = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await plastApi.getReports(activeTab, {
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        customer_id: customerId || undefined,
        supplier_id: supplierId || undefined,
      });
      const resolved = res?.summary ? res : res?.data || res || {};
      setReportData(resolved);
    } catch (err) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab, fromDate, toDate, customerId, supplierId]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const exportToCSV = () => {
    const list = Array.isArray(reportData?.data) ? reportData.data : [];
    if (list.length === 0) {
      toast.error("No data to export");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "sales") {
      csvContent += "Invoice No,Date,Customer,Phone,Items Count,Subtotal,Discount,Taxable,GST Rate,GST Amount,Grand Total\n";
      list.forEach((s) => {
        csvContent += `"${s.sale_number}","${s.sale_date}","${s.customer_name}","${s.customer_phone || ""}","${s.items_count || 0}","${s.subtotal}","${s.total_discount}","${s.taxable_amount}","${s.gst_rate}%","${s.gst_amount}","${s.grand_total}"\n`;
      });
    } else if (activeTab === "purchases") {
      csvContent += "Receipt Date,Supplier,Reference,Items Count,Total Amount\n";
      list.forEach((p) => {
        csvContent += `"${p.receipt_date}","${p.supplier_name || p.supplier?.name || ""}","${p.reference_number || ""}","${p.items_count || 0}","${p.total_amount}"\n`;
      });
    } else if (activeTab === "production") {
      csvContent += "Date,Reference,Materials Consumed Count,Finished Produced Count,Notes\n";
      list.forEach((e) => {
        csvContent += `"${e.production_date}","${e.reference_number || ""}","${e.materials?.length || 0}","${e.outputs?.length || 0}","${e.notes || ""}"\n`;
      });
    } else if (activeTab === "stock") {
      csvContent += "Item Name,Type,Category,Unit Price,Quantity On Hand,Stock Value\n";
      list.forEach((st) => {
        csvContent += `"${st.name}","${st.item_type}","${st.category || ""}","${st.unit_price}","${st.quantity_on_hand}","${st.stock_value}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cheran_plast_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded");
  };

  const safeDataList = Array.isArray(reportData?.data) ? reportData.data : [];
  const summary = reportData?.summary || {};
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Reports & Analytics"
        subtitle="Financial reports, production summaries, and inventory valuation"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchReport(true)}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#FAFAF8] p-1 rounded-[8px] border border-[#E4E1D8] overflow-x-auto">
          {[
            { id: "sales", label: "Sales Report" },
            { id: "purchases", label: "Raw Purchases Report" },
            { id: "production", label: "Production & Wastage" },
            { id: "stock", label: "Stock Valuation" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-[#2F6F5E] shadow-xs font-bold border border-[#E4E1D8]"
                  : "text-[#52607D] hover:text-[#14213D]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Bar (Date Presets & Dropdowns) */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-[#FAFAF8] p-1 rounded-[6px] border border-[#E4E1D8]">
            {["TODAY", "THIS_WEEK", "THIS_MONTH", "ALL", "CUSTOM"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDatePreset(p)}
                className={`px-2.5 py-1 rounded-[5px] text-[11px] font-semibold transition-all cursor-pointer ${
                  datePreset === p
                    ? "bg-white text-[#2F6F5E] shadow-xs font-bold border border-[#E4E1D8]"
                    : "text-[#52607D] hover:text-[#14213D]"
                }`}
              >
                {p.replace("_", " ")}
              </button>
            ))}
          </div>

          {datePreset === "CUSTOM" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
              />
              <span className="text-[#52607D]">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          )}

          {activeTab === "sales" && (
            <div className="w-48">
              <CustomSelect
                theme="blue"
                size="sm"
                value={customerId}
                onChange={(val) => setCustomerId(val)}
                placeholder="All Customers"
                options={[
                  { value: "", label: "All Customers" },
                  ...safeCustomers.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]}
              />
            </div>
          )}

          {activeTab === "purchases" && (
            <div className="w-48">
              <CustomSelect
                theme="blue"
                size="sm"
                value={supplierId}
                onChange={(val) => setSupplierId(val)}
                placeholder="All Suppliers"
                options={[
                  { value: "", label: "All Suppliers" },
                  ...safeSuppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
              />
            </div>
          )}
        </div>

        {/* Summary Metric Cards for Active Tab */}
        {activeTab === "sales" && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <MetricCard
              title="Total Invoices"
              value={`${summary.total_invoices || 0} Bills`}
              subtitle="Filtered sales period"
              icon={BarChart3}
            />
            <MetricCard
              title="Gross Sales"
              value={formatCurrency(summary.total_gross_sales || 0)}
              subtitle="Total invoice amount"
              icon={DollarSign}
            />
            <MetricCard
              title="Taxable Turnover"
              value={formatCurrency(summary.total_taxable_sales || 0)}
              subtitle="Net taxable amount"
              icon={TrendingUp}
            />
            <MetricCard
              title="GST Collected"
              value={formatCurrency(summary.total_gst_collected || 0)}
              subtitle="Output GST tax"
              icon={DollarSign}
            />
          </div>
        )}

        {activeTab === "purchases" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              title="Total Inward Spend"
              value={formatCurrency(summary.total_purchase_amount || 0)}
              subtitle="Raw material purchases"
              icon={DollarSign}
            />
            <MetricCard
              title="Purchase Receipts"
              value={`${summary.total_receipts || 0} Invoices`}
              subtitle="Supplier inward records"
              icon={Boxes}
            />
          </div>
        )}

        {activeTab === "stock" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Total Stock Value"
              value={formatCurrency(summary.total_stock_value || 0)}
              subtitle="Live on-hand valuation"
              icon={DollarSign}
            />
            <MetricCard
              title="Raw Material Valuation"
              value={formatCurrency(summary.raw_material_valuation || 0)}
              subtitle="Purchased materials"
              icon={Boxes}
            />
            <MetricCard
              title="Finished Goods Valuation"
              value={formatCurrency(summary.finished_goods_valuation || 0)}
              subtitle="Manufactured goods"
              icon={TrendingUp}
            />
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={5} />
            </div>
          ) : safeDataList.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No report records found"
              description="Try adjusting your date range or filter options to view historical records."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                {activeTab === "sales" && (
                  <>
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-3 text-right">Subtotal</th>
                        <th className="py-3 px-3 text-right">Discount</th>
                        <th className="py-3 px-3 text-right">Taxable</th>
                        <th className="py-3 px-3 text-right">GST</th>
                        <th className="py-3 px-4 text-right">Grand Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeDataList.map((s) => (
                        <tr key={s.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#2F6F5E]">{s.sale_number}</td>
                          <td className="py-3 px-3 text-[#52607D]">{s.sale_date}</td>
                          <td className="py-3 px-4 font-bold text-[#14213D]">{s.customer_name}</td>
                          <td className="py-3 px-3 text-right text-[#52607D]">{formatCurrency(s.subtotal)}</td>
                          <td className="py-3 px-3 text-right text-emerald-700 font-mono">
                            {Number(s.total_discount) > 0 ? `-${formatCurrency(s.total_discount)}` : "—"}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-[#14213D]">{formatCurrency(s.taxable_amount)}</td>
                          <td className="py-3 px-3 text-right text-[#52607D]">{formatCurrency(s.gst_amount)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">{formatCurrency(s.grand_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === "purchases" && (
                  <>
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Receipt Date</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-3">Reference No</th>
                        <th className="py-3 px-3 text-center">Items Count</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeDataList.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#14213D]">{p.receipt_date}</td>
                          <td className="py-3 px-4 font-medium text-[#14213D]">{p.supplier_name || p.supplier?.name || "Direct"}</td>
                          <td className="py-3 px-3 text-[#52607D] font-mono">{p.reference_number || "—"}</td>
                          <td className="py-3 px-3 text-center text-[#52607D]">{p.items?.length || 0}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">{formatCurrency(p.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === "production" && (
                  <>
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-3">Batch / Ref</th>
                        <th className="py-3 px-4">Raw Materials Consumed</th>
                        <th className="py-3 px-4">Finished Outputs</th>
                        <th className="py-3 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeDataList.map((e) => (
                        <tr key={e.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#2F6F5E]">{e.production_date}</td>
                          <td className="py-3 px-3 text-[#52607D] font-mono">{e.reference_number || "—"}</td>
                          <td className="py-3 px-4 text-[#52607D]">
                            {(e.materials || []).map((m) => `${m.item?.name || "Raw"}: ${m.quantity_used}${m.unit?.symbol || "Kg"}`).join(", ") || "None"}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#14213D]">
                            {(e.outputs || []).map((o) => `${o.item?.name || "Fin"}: +${o.quantity_produced}${o.unit?.symbol || "Nos"}`).join(", ") || "None"}
                          </td>
                          <td className="py-3 px-3 text-[#52607D] italic">{e.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === "stock" && (
                  <>
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3 text-right">Unit Price</th>
                        <th className="py-3 px-4 text-right">On-Hand Qty</th>
                        <th className="py-3 px-4 text-right">Stock Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeDataList.map((st) => (
                        <tr key={st.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-bold text-[#14213D]">{st.name}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                st.item_type === "RAW_MATERIAL"
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : "bg-[#EAF3F0] text-[#2F6F5E] border border-[#D3E6E0]"
                              }`}
                            >
                              {st.item_type === "RAW_MATERIAL" ? "Raw Material" : "Finished Good"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#52607D]">{st.category || "—"}</td>
                          <td className="py-3 px-3 text-right font-mono text-[#14213D]">{formatCurrency(st.unit_price)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                            {st.quantity_on_hand} {st.unit?.symbol || ""}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#2F6F5E]">
                            {formatCurrency(st.stock_value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PlastReportsPage;
