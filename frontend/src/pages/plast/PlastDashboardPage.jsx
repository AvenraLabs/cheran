import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  TrendingUp,
  Factory,
  Boxes,
  RefreshCw,
  Plus,
  ArrowRight,
  Truck,
  Package,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { SkeletonLoader } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

export function PlastDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getDashboardStats();
      setStats(data?.data || data || {});
    } catch (err) {
      toast.error("Failed to load Cheran Plast metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const lowStockItems = Array.isArray(stats?.low_stock_items) ? stats.low_stock_items : [];
  const recentSales = Array.isArray(stats?.recent_sales) ? stats.recent_sales : [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Dashboard"
        subtitle="Cheran Plast Operations, Inventory & Sales Overview"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchStats(true)}
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
        {loading ? (
          <SkeletonLoader count={4} />
        ) : (
          <>
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Today's Sales"
                value={formatCurrency(stats?.today_sales_revenue || 0)}
                subtitle={`${stats?.today_sales_count || 0} Bills Issued Today`}
                icon={ShoppingCart}
              />
              <MetricCard
                title="This Month Sales"
                value={formatCurrency(stats?.month_sales_revenue || 0)}
                subtitle="Total Sales This Month"
                icon={TrendingUp}
              />
              <MetricCard
                title="Production Today"
                value={`${stats?.production_today_units || 0} Units`}
                subtitle={`Wastage: ${stats?.wastage_today_units || 0} Units`}
                icon={Factory}
              />
              <MetricCard
                title="Active Catalog"
                value={`${stats?.raw_materials_count || 0} Raw • ${stats?.finished_goods_count || 0} Fin`}
                subtitle="Active Master Items"
                icon={Boxes}
              />
            </div>

            {/* Quick Action Shortcuts */}
            <div className="bg-white p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#52607D] mb-3">
                Quick Operations
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link
                  to="/plast/sales/new"
                  className="p-3 rounded-[8px] border border-[#E4E1D8] hover:border-[#2F6F5E] hover:bg-[#EAF3F0] transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-[6px] bg-emerald-100 text-[#2F6F5E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShoppingCart size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#14213D] group-hover:text-[#2F6F5E]">
                      New Sale Bill
                    </div>
                    <div className="text-[10px] text-[#52607D]">Issue customer invoice</div>
                  </div>
                </Link>

                <Link
                  to="/plast/production"
                  className="p-3 rounded-[8px] border border-[#E4E1D8] hover:border-[#2F6F5E] hover:bg-[#EAF3F0] transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-[6px] bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Factory size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#14213D] group-hover:text-[#2F6F5E]">
                      Daily Production
                    </div>
                    <div className="text-[10px] text-[#52607D]">Log usage & output</div>
                  </div>
                </Link>

                <Link
                  to="/plast/purchases"
                  className="p-3 rounded-[8px] border border-[#E4E1D8] hover:border-[#2F6F5E] hover:bg-[#EAF3F0] transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-[6px] bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Truck size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#14213D] group-hover:text-[#2F6F5E]">
                      Buy Raw Materials
                    </div>
                    <div className="text-[10px] text-[#52607D]">Inward from supplier</div>
                  </div>
                </Link>

                <Link
                  to="/plast/items"
                  className="p-3 rounded-[8px] border border-[#E4E1D8] hover:border-[#2F6F5E] hover:bg-[#EAF3F0] transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-[6px] bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Package size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#14213D] group-hover:text-[#2F6F5E]">
                      Items
                    </div>
                    <div className="text-[10px] text-[#52607D]">Manage catalog</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Tables Section: Low Stock + Recent Sales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low Stock Alert Table */}
              <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[#EDEAE1] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <h2 className="text-sm font-bold font-display text-[#14213D]">
                      Low Stock Alerts (&le; 5 Units)
                    </h2>
                  </div>
                  <Link
                    to="/plast/stock"
                    className="text-xs font-semibold text-[#2F6F5E] hover:underline flex items-center gap-1"
                  >
                    <span>View All Stock</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="flex-1 overflow-x-auto">
                  {lowStockItems.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#52607D]">
                      No low-stock alerts. Inventory levels are healthy.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Item Name</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-4 text-right">Current Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {lowStockItems.map((item) => (
                          <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                            <td className="py-2.5 px-4 font-bold text-[#14213D]">{item.name}</td>
                            <td className="py-2.5 px-3">
                              <StatusBadge status={item.item_type} />
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">
                              {item.stock?.current_quantity || 0} {item.unit?.symbol || "Nos"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Recent Sales Table */}
              <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[#EDEAE1] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt size={16} className="text-[#2F6F5E]" />
                    <h2 className="text-sm font-bold font-display text-[#14213D]">
                      Recent Sales Invoices
                    </h2>
                  </div>
                  <Link
                    to="/plast/sales"
                    className="text-xs font-semibold text-[#2F6F5E] hover:underline flex items-center gap-1"
                  >
                    <span>View All Sales</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="flex-1 overflow-x-auto">
                  {recentSales.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#52607D]">
                      No sales bills issued yet.{" "}
                      <Link to="/plast/sales/new" className="text-[#2F6F5E] font-bold hover:underline">
                        Create first bill
                      </Link>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Invoice No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {recentSales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-[#FAFAF8] transition-colors">
                            <td className="py-2.5 px-4 font-mono font-bold text-[#2F6F5E]">
                              {sale.sale_number}
                            </td>
                            <td className="py-2.5 px-3 text-[#52607D]">{sale.sale_date}</td>
                            <td className="py-2.5 px-3 font-medium text-[#14213D] truncate max-w-[120px]">
                              {sale.customer_name}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#14213D]">
                              {formatCurrency(sale.grand_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default PlastDashboardPage;
