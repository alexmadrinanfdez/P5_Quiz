'use strict';

var crypt = require('../helpers/crypt');

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.
    */
    return queryInterface.bulkInsert('users', [
        {
          username: 'admin',
          password: crypt.encryptPassword('1234', 'aaaa'),
          salt: 'aaaa',
          isAdmin: true,
          createdAt: new Date(), updatedAt: new Date()
        },
        {
          username: 'common',
          password: crypt.encryptPassword('1234', 'bbbb'),
          salt: 'bbbb',
          createdAt: new Date(), updatedAt: new Date()
        }
      ]
    );
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.
    */
    return queryInterface.bulkDelete('users', null, {});
  }
};
