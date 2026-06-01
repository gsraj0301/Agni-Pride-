const {DataTypes} = require('sequelize');

module.exports = (sequelize) => {
    const Registration = sequelize.define('Registration', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        hackathonId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false   
        },
        mentorName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('registered', 'participated', 'shortlisted', 'winner'),
            defaultValue: 'registered',
            allowNull: false
        },
        certificate: {
            type: DataTypes.STRING,
            allowNull: true
        }
        } );
        return Registration;
}
