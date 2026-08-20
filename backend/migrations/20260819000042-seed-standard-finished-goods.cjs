"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Disabled auto-seeding. Items must only be created manually by staff via the Item Master UI.
  },

  async down(queryInterface, Sequelize) {
    // Non-destructive
  },
};
