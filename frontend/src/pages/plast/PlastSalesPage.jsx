import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Printer,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

export function PlastSalesPage() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal for view/print invoice
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchSales = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getSales({
        customer_id: customerId || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: search || undefined,
      });
      setSales(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await plastApi.getCustomers();
      setCustomers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, customerId, fromDate, toDate]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const safeSales = Array.isArray(sales) ? sales : [];
  const totalRevenue = safeSales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
  const totalTaxable = safeSales.reduce((acc, s) => acc + Number(s.taxable_amount || 0), 0);
  const totalGst = safeSales.reduce((acc, s) => acc + Number(s.gst_amount || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Sales & Billing"
        subtitle="Customer sales bills, item discounts, and tax calculation"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchSales(true)}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate("/plast/sales/new")}
            >
              + New Sale Bill
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Sales Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle="Gross invoice turnover"
            icon={DollarSign}
          />
          <MetricCard
            title="Taxable Turnover"
            value={formatCurrency(totalTaxable)}
            subtitle="Net taxable amount"
            icon={TrendingUp}
          />
          <MetricCard
            title="Total GST Collected"
            value={formatCurrency(totalGst)}
            subtitle="Output GST tax"
            icon={Receipt}
          />
          <MetricCard
            title="Total Invoices"
            value={`${safeSales.length} Bills`}
            subtitle="Issued direct invoices"
            icon={FileText}
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-xs">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div>
            <CustomSelect
              size="sm"
              value={customerId}
              onChange={(val) => setCustomerId(val)}
              placeholder="All Customers"
              options={[
                { value: "", label: "All Customers" },
                ...(Array.isArray(customers) ? customers : []).map((c) => ({
                  value: c.id,
                  label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
                })),
              ]}
            />
          </div>

          <div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>
        </div>

        {/* Sales Invoices Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={5} />
            </div>
          ) : safeSales.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No sales invoices found"
              description="Click '+ New Sale Bill' above to issue a customer invoice with per-item discounts."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3 text-center">Items</th>
                    <th className="py-3 px-3 text-right">Taxable</th>
                    <th className="py-3 px-3 text-right">GST ({sales[0]?.gst_rate || 0}%)</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {safeSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#2F6F5E]">
                        {sale.sale_number}
                      </td>
                      <td className="py-3 px-3 text-[#52607D]">{sale.sale_date}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#14213D]">{sale.customer_name}</div>
                        {sale.customer_phone && (
                          <div className="text-[10px] text-[#52607D] font-mono">{sale.customer_phone}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-[#52607D]">
                        {sale.items?.length || 0}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-[#14213D]">
                        {formatCurrency(sale.taxable_amount)}
                      </td>
                      <td className="py-3 px-3 text-right text-[#52607D]">
                        {formatCurrency(sale.gst_amount)} ({sale.gst_rate}%)
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D] text-sm">
                        {formatCurrency(sale.grand_total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Eye}
                          onClick={() => setSelectedSale(sale)}
                        >
                          View Bill
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Invoice Detail / Printable Modal */}
      <Modal
        isOpen={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
        title={`Invoice: ${selectedSale?.sale_number || ""}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div id="printable-bill" className="p-4 bg-white rounded border border-[#E4E1D8] space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-[#EDEAE1] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#2F6F5E]">CHERAN PLAST</h2>
                  <p className="text-[10px] text-[#52607D]">PVC & Polymer Manufacturing Division</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#14213D]">{selectedSale.sale_number}</div>
                  <div className="text-[#52607D]">Date: {selectedSale.sale_date}</div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#EDEAE1]">
                <div className="text-[10px] font-bold text-[#52607D] uppercase">Billed To</div>
                <div className="text-sm font-bold text-[#14213D] mt-0.5">{selectedSale.customer_name}</div>
                {selectedSale.customer_phone && (
                  <div className="text-xs text-[#52607D] font-mono">Phone: {selectedSale.customer_phone}</div>
                )}
              </div>

              {/* Items in Invoice */}
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D]">
                  <tr>
                    <th className="py-2 px-2">Item Name</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Price</th>
                    <th className="py-2 px-2 text-right">Disc</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {selectedSale.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 font-medium">{it.item_name}</td>
                      <td className="py-2 px-2 text-center font-mono">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">{formatCurrency(it.unit_price)}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#52607D]">
                        {it.discount_percentage ? `${it.discount_percentage}%` : "—"}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-[#14213D]">
                        {formatCurrency(it.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Row */}
              <div className="flex justify-end pt-2 border-t border-[#EDEAE1]">
                <div className="w-64 space-y-1">
                  {Number(selectedSale.discount_amount) > 0 && (
                    <div className="flex justify-between text-[#52607D]">
                      <span>Bill Discount:</span>
                      <span>- {formatCurrency(selectedSale.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#52607D]">
                    <span>Taxable Amount:</span>
                    <span>{formatCurrency(selectedSale.taxable_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[#52607D]">
                    <span>GST ({selectedSale.gst_rate}%):</span>
                    <span>{formatCurrency(selectedSale.gst_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#14213D] border-t border-[#EDEAE1] pt-1.5">
                    <span>Grand Total:</span>
                    <span className="text-[#2F6F5E]">{formatCurrency(selectedSale.grand_total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedSale(null)}>
                Close
              </Button>
              <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PlastSalesPage;
