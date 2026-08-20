// Core Government Module Models
import Dealer from "../modules/dealers/dealer.model.js";
import GovernmentStatus from "../modules/statuses/status.model.js";
import GovernmentProject from "../modules/projects/project.model.js";
import GovernmentProjectStatusHistory from "../modules/projects/project-history.model.js";
import GovernmentImport from "../modules/imports/import.model.js";
import GovernmentImportRow from "../modules/imports/import-row.model.js";

// Units & Items Masters
import Unit from "../modules/units/unit.model.js";
import Item from "../modules/items/item.model.js";

// Suppliers & Inventory & Production
import Supplier from "../modules/suppliers/supplier.model.js";
import StockReceipt from "../modules/inventory/stock-receipt.model.js";
import StockReceiptItem from "../modules/inventory/stock-receipt-item.model.js";
import InventoryMovement from "../modules/inventory/inventory-movement.model.js";
import InventoryStock from "../modules/inventory/inventory-stock.model.js";
import ProductionEntry from "../modules/inventory/production-entry.model.js";
import ProductionMaterial from "../modules/inventory/production-material.model.js";
import ProductionOutput from "../modules/inventory/production-output.model.js";

// Commissions
import DealerCommission from "../modules/dealers/dealer-commission.model.js";

// Expenses
import ExpenseCategory from "../modules/expenses/expense-category.model.js";
import Expense from "../modules/expenses/expense.model.js";

// Employees & Attendance & Salary
import Employee from "../modules/employees/employee.model.js";
import EmployeeAttendance from "../modules/employees/employee-attendance.model.js";
import EmployeeSalaryRecord from "../modules/employees/employee-salary-record.model.js";

// Customers & Invoices
import Customer from "../modules/customers/customer.model.js";
import Invoice from "../modules/invoices/invoice.model.js";
import InvoiceItem from "../modules/invoices/invoice-item.model.js";

// ==========================================
// 1. Government Module Associations
// ==========================================

// Dealer <-> Projects
Dealer.hasMany(GovernmentProject, {
  foreignKey: "dealer_id",
  as: "projects",
  onDelete: "SET NULL",
});
GovernmentProject.belongsTo(Dealer, {
  foreignKey: "dealer_id",
  as: "dealer",
});

// Project <-> Status History
GovernmentProject.hasMany(GovernmentProjectStatusHistory, {
  foreignKey: "project_id",
  as: "status_history",
  onDelete: "CASCADE",
});
GovernmentProjectStatusHistory.belongsTo(GovernmentProject, {
  foreignKey: "project_id",
  as: "project",
});

// Import <-> Status History
GovernmentImport.hasMany(GovernmentProjectStatusHistory, {
  foreignKey: "source_import_id",
  as: "status_histories",
  onDelete: "SET NULL",
});
GovernmentProjectStatusHistory.belongsTo(GovernmentImport, {
  foreignKey: "source_import_id",
  as: "source_import",
});

// Import <-> Import Rows
GovernmentImport.hasMany(GovernmentImportRow, {
  foreignKey: "import_id",
  as: "rows",
  onDelete: "CASCADE",
});
GovernmentImportRow.belongsTo(GovernmentImport, {
  foreignKey: "import_id",
  as: "import",
});

// Import Row <-> Project
GovernmentImportRow.belongsTo(GovernmentProject, {
  foreignKey: "matched_project_id",
  as: "matched_project",
});

// Import Row <-> Dealer
GovernmentImportRow.belongsTo(Dealer, {
  foreignKey: "matched_dealer_id",
  as: "matched_dealer",
});

// ==========================================
// 2. Units & Items Associations
// ==========================================

Unit.hasMany(Item, {
  foreignKey: "unit_id",
  as: "items",
  onDelete: "RESTRICT",
});
Item.belongsTo(Unit, {
  foreignKey: "unit_id",
  as: "unit",
});

// Item <-> Inventory Stock
Item.hasOne(InventoryStock, {
  foreignKey: "item_id",
  as: "stock",
  onDelete: "CASCADE",
});
InventoryStock.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

// Item <-> Inventory Movements
Item.hasMany(InventoryMovement, {
  foreignKey: "item_id",
  as: "movements",
  onDelete: "RESTRICT",
});
InventoryMovement.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

// Unit <-> Inventory Movements
Unit.hasMany(InventoryMovement, {
  foreignKey: "unit_id",
  as: "movements",
  onDelete: "RESTRICT",
});
InventoryMovement.belongsTo(Unit, {
  foreignKey: "unit_id",
  as: "unit",
});

// ==========================================
// 3. Suppliers & Stock Receipts
// ==========================================

Supplier.hasMany(StockReceipt, {
  foreignKey: "supplier_id",
  as: "receipts",
  onDelete: "SET NULL",
});
StockReceipt.belongsTo(Supplier, {
  foreignKey: "supplier_id",
  as: "supplier",
});

StockReceipt.hasMany(StockReceiptItem, {
  foreignKey: "stock_receipt_id",
  as: "items",
  onDelete: "CASCADE",
});
StockReceiptItem.belongsTo(StockReceipt, {
  foreignKey: "stock_receipt_id",
  as: "receipt",
});

Item.hasMany(StockReceiptItem, {
  foreignKey: "item_id",
  as: "receipt_items",
  onDelete: "RESTRICT",
});
StockReceiptItem.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

Unit.hasMany(StockReceiptItem, {
  foreignKey: "unit_id",
  as: "receipt_items",
  onDelete: "RESTRICT",
});
StockReceiptItem.belongsTo(Unit, {
  foreignKey: "unit_id",
  as: "unit",
});

// Production Associations
ProductionEntry.hasMany(ProductionMaterial, {
  foreignKey: "production_entry_id",
  as: "materials",
  onDelete: "CASCADE",
});
ProductionMaterial.belongsTo(ProductionEntry, {
  foreignKey: "production_entry_id",
  as: "production_entry",
});

Item.hasMany(ProductionMaterial, {
  foreignKey: "item_id",
  as: "production_materials",
  onDelete: "RESTRICT",
});
ProductionMaterial.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

Unit.hasMany(ProductionMaterial, {
  foreignKey: "unit_id",
  as: "production_materials",
  onDelete: "RESTRICT",
});
ProductionMaterial.belongsTo(Unit, {
  foreignKey: "unit_id",
  as: "unit",
});

ProductionEntry.hasMany(ProductionOutput, {
  foreignKey: "production_entry_id",
  as: "outputs",
  onDelete: "CASCADE",
});
ProductionOutput.belongsTo(ProductionEntry, {
  foreignKey: "production_entry_id",
  as: "production_entry",
});

Item.hasMany(ProductionOutput, {
  foreignKey: "item_id",
  as: "production_outputs",
  onDelete: "RESTRICT",
});
ProductionOutput.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

Unit.hasMany(ProductionOutput, {
  foreignKey: "unit_id",
  as: "production_outputs",
  onDelete: "RESTRICT",
});
ProductionOutput.belongsTo(Unit, {
  foreignKey: "unit_id",
  as: "unit",
});

// ==========================================
// 4. Dealer Commissions
// ==========================================

Dealer.hasMany(DealerCommission, {
  foreignKey: "dealer_id",
  as: "commissions",
  onDelete: "CASCADE",
});
DealerCommission.belongsTo(Dealer, {
  foreignKey: "dealer_id",
  as: "dealer",
});

GovernmentProject.hasMany(DealerCommission, {
  foreignKey: "project_id",
  as: "commissions",
  onDelete: "SET NULL",
});
DealerCommission.belongsTo(GovernmentProject, {
  foreignKey: "project_id",
  as: "project",
});

// ==========================================
// 5. Expenses
// ==========================================

ExpenseCategory.hasMany(Expense, {
  foreignKey: "category_id",
  as: "expenses",
  onDelete: "RESTRICT",
});
Expense.belongsTo(ExpenseCategory, {
  foreignKey: "category_id",
  as: "category",
});

// ==========================================
// 6. Employees, Attendance & Salary
// ==========================================

Employee.hasMany(EmployeeAttendance, {
  foreignKey: "employee_id",
  as: "attendance_records",
  onDelete: "CASCADE",
});
EmployeeAttendance.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

Employee.hasMany(EmployeeSalaryRecord, {
  foreignKey: "employee_id",
  as: "salary_records",
  onDelete: "CASCADE",
});
EmployeeSalaryRecord.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

// ==========================================
// 7. Customers & Invoices
// ==========================================

Invoice.hasMany(InvoiceItem, {
  foreignKey: "invoice_id",
  as: "items",
  onDelete: "CASCADE",
});
InvoiceItem.belongsTo(Invoice, {
  foreignKey: "invoice_id",
  as: "invoice",
});

Item.hasMany(InvoiceItem, {
  foreignKey: "item_id",
  as: "invoice_items",
  onDelete: "RESTRICT",
});
InvoiceItem.belongsTo(Item, {
  foreignKey: "item_id",
  as: "item",
});

Unit.hasMany(InvoiceItem, {
  foreignKey: "unit_id",
  as: "invoice_items",
  onDelete: "RESTRICT",
});
InvoiceItem.belongsTo(Unit, {
  foreignKey: "unit_id",
  as: "unit",
});

Customer.hasMany(Invoice, {
  foreignKey: "customer_id",
  as: "invoices",
  onDelete: "RESTRICT",
});
Invoice.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

GovernmentProject.hasMany(Invoice, {
  foreignKey: "government_project_id",
  as: "invoices",
  onDelete: "SET NULL",
});
Invoice.belongsTo(GovernmentProject, {
  foreignKey: "government_project_id",
  as: "government_project",
});

Dealer.hasMany(Invoice, {
  foreignKey: "dealer_id",
  as: "invoices",
  onDelete: "SET NULL",
});
Invoice.belongsTo(Dealer, {
  foreignKey: "dealer_id",
  as: "dealer",
});


export {
  Dealer,
  GovernmentStatus,
  GovernmentProject,
  GovernmentProjectStatusHistory,
  GovernmentImport,
  GovernmentImportRow,
  Unit,
  Item,
  Supplier,
  StockReceipt,
  StockReceiptItem,
  InventoryMovement,
  InventoryStock,
  ProductionEntry,
  ProductionMaterial,
  ProductionOutput,
  DealerCommission,
  ExpenseCategory,
  Expense,
  Employee,
  EmployeeAttendance,
  EmployeeSalaryRecord,
  Customer,
  Invoice,
  InvoiceItem,
};
