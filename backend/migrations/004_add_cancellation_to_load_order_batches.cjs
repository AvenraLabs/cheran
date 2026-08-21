const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable("load_order_batches").catch(() => ({}));

    if (!tableInfo.is_cancelled) {
      await queryInterface.addColumn("load_order_batches", "is_cancelled", {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }

    if (!tableInfo.cancelled_at) {
      await queryInterface.addColumn("load_order_batches", "cancelled_at", {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    if (!tableInfo.cancellation_reason) {
      await queryInterface.addColumn("load_order_batches", "cancellation_reason", {
        type: DataTypes.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable("load_order_batches").catch(() => ({}));

    if (tableInfo.cancellation_reason) {
      await queryInterface.removeColumn("load_order_batches", "cancellation_reason");
    }
    if (tableInfo.cancelled_at) {
      await queryInterface.removeColumn("load_order_batches", "cancelled_at");
    }
    if (tableInfo.is_cancelled) {
      await queryInterface.removeColumn("load_order_batches", "is_cancelled");
    }
  },
};
