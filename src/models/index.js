const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config').database;

const db = {};
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Read all models from the current directory
fs.readdirSync(__dirname)
  .filter(file => 
    file.indexOf('.') !== 0 && 
    file !== path.basename(__filename) && 
    file.slice(-3) === '.js'
  )
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Associate models if associations exist
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;