import api from "./client.js";

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const unwrapData = (res) => {
  if (res && res.data !== undefined) return res.data;
  return res || {};
};

export const plastApi = {
  // Dashboard & Reports
  getDashboardStats: () => api.get("/plast/dashboard").then(unwrapData),
  getReports: (type, params) => api.get("/plast/reports", { params: { type, ...params } }).then(unwrapData),

  // Units
  getUnits: () => api.get("/plast/units").then(unwrapList),
  createUnit: (data) => api.post("/plast/units", data).then(unwrapData),

  // Items
  getItems: (params) => api.get("/plast/items", { params }).then(unwrapList),
  getItemById: (id) => api.get(`/plast/items/${id}`).then(unwrapData),
  createItem: (data) => api.post("/plast/items", data).then(unwrapData),
  updateItem: (id, data) => api.put(`/plast/items/${id}`, data).then(unwrapData),
  deleteItem: (id) => api.delete(`/plast/items/${id}`).then(unwrapData),

  // Suppliers / Vendors
  getSuppliers: (search = "") => api.get("/plast/suppliers", { params: { search } }).then(unwrapList),
  createSupplier: (data) => api.post("/plast/suppliers", data).then(unwrapData),
  updateSupplier: (id, data) => api.put(`/plast/suppliers/${id}`, data).then(unwrapData),

  // Customers
  getCustomers: (search = "") => api.get("/plast/customers", { params: { search } }).then(unwrapList),
  createCustomer: (data) => api.post("/plast/customers", data).then(unwrapData),
  updateCustomer: (id, data) => api.put(`/plast/customers/${id}`, data).then(unwrapData),

  // Stock On-Hand
  getStockOnHand: (params) => api.get("/plast/inventory/stock", { params }).then(unwrapList),

  // Purchases (Raw Material Receipts)
  getPurchases: (params) => api.get("/plast/purchases", { params }).then(unwrapList),
  createPurchase: (data) => api.post("/plast/purchases", data).then(unwrapData),

  // Production
  getProductionEntries: (params) => api.get("/plast/production", { params }).then(unwrapList),
  createProductionEntry: (data) => api.post("/plast/production", data).then(unwrapData),

  // Sales
  getSales: (params) => api.get("/plast/sales", { params }).then(unwrapList),
  getSaleById: (id) => api.get(`/plast/sales/${id}`).then(unwrapData),
  createSale: (data) => api.post("/plast/sales", data).then(unwrapData),
};

export default plastApi;
