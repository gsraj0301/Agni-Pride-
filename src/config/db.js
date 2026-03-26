const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false, // Set to console.log to see SQL queries
    }
);

const connectDB = async () => {
    // #region agent log
    globalThis.fetch && globalThis.fetch('http://127.0.0.1:7930/ingest/ab19ee87-eaf1-4e27-9823-4891135419d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'00905c'},body:JSON.stringify({sessionId:'00905c',runId:'pre-fix',hypothesisId:'H1',location:'src/config/db.js:connectDB:enter',message:'connectDB called',data:{hasDBHost:!!process.env.DB_HOST,hasDBUser:!!process.env.DB_USER,hasDBName:!!process.env.DB_NAME,hasDBPassword:!!process.env.DB_PASSWORD},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        // #region agent log
        globalThis.fetch && globalThis.fetch('http://127.0.0.1:7930/ingest/ab19ee87-eaf1-4e27-9823-4891135419d8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'00905c'},body:JSON.stringify({sessionId:'00905c',runId:'pre-fix',hypothesisId:'H1',location:'src/config/db.js:connectDB:error',message:'DB authenticate failed',data:{ok:false,errorName:error?.name||null,errorCode:error?.original?.code||error?.code||null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        console.error('Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, connectDB };
