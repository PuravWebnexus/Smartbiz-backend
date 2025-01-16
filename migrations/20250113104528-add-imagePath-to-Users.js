'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'imagePath', {
      type: Sequelize.STRING,
      allowNull: true, // Allow null values if the image is optional
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'imagePath');
  },
};