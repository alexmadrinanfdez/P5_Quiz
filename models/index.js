const path = require('path');
// Load ORM
const Sequelize = require('sequelize');

// To use SQLite data base:
//  DATABASE_URL = sqlite:quiz.sqlite
// To use Heroku Postgres data base:
//  DATABASE_URL = postgres://user:passwd@host:port/database
const url = process.env.DATABASE_URL || "sqlite:quiz.sqlite";
const sequelize = new Sequelize(url);

// Import the definition of quiz from quiz.js
sequelize.import(path.join(__dirname, 'quiz'));
// Session
sequelize.import(path.join(__dirname, 'session'));
// Import the definition of tip from tip.js
sequelize.import(path.join(__dirname, 'tip'));
// Import the definition of user from user.js
sequelize.import(path.join(__dirname, 'user'));
// Import the definition of attachment from attachment.js
sequelize.import(path.join(__dirname, 'attachment'));

// Relations between models
const {quiz, tip, user, attachment} = sequelize.models;

tip.belongsTo(quiz);
quiz.hasMany(tip);

user.hasMany(quiz, {foreignKey: 'authorId'});
quiz.belongsTo(user, {as: 'author', foreignKey: 'authorId'});

attachment.belongsTo(quiz);
quiz.hasOne(attachment);

module.exports = sequelize;