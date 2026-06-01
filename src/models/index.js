const { sequelize } = require('../config/db');

const UserModel= require('./User');
const HackathonModel = require('./Hackathon');
const RegistrationModel = require('./Registrations');

const User = UserModel(sequelize);
const Hackathon = HackathonModel(sequelize);
const Registration = RegistrationModel(sequelize);


// Define associations
Hackathon.belongsTo(User, { foreignKey: 'postedBy', as: 'admin' });
User.hasMany(Hackathon, { foreignKey: 'postedBy', as: 'postedHackathons' });

// Registration associations
Registration.belongsTo(User, { foreignKey: 'userId', as: 'student' });
Registration.belongsTo(Hackathon, { foreignKey: 'hackathonId', as: 'hackathon' });
User.hasMany(Registration, { foreignKey: 'userId', as: 'registrations' });
Hackathon.hasMany(Registration, { foreignKey: 'hackathonId', as: 'registrations' });

module.exports = { User, Hackathon, Registration };
