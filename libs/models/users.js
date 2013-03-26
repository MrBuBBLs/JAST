var Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('User', {
        username: Sequelize.STRING,
        password: Sequelize.STRING,
        email: {
            type: Sequelize.STRING,
            validate: {isEmail:true}
        }
    });
}