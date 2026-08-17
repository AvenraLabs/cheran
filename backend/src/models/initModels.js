import Dealer from "../modules/dealers/dealer.model.js";
import GovernmentStatus from "../modules/statuses/status.model.js";
import GovernmentProject from "../modules/projects/project.model.js";
import GovernmentProjectStatusHistory from "../modules/projects/project-history.model.js";
import GovernmentImport from "../modules/imports/import.model.js";
import GovernmentImportRow from "../modules/imports/import-row.model.js";

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

export {
  Dealer,
  GovernmentStatus,
  GovernmentProject,
  GovernmentProjectStatusHistory,
  GovernmentImport,
  GovernmentImportRow,
};
