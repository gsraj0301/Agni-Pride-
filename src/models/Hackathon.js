const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    const Hackathon = sequelize.define('Hackathon', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        institute: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        deadline: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        teamSize: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        posterImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        postedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    });
    
    return Hackathon;
};