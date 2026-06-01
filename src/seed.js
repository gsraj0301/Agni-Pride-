const bcrypt = require('bcrypt');
const { sequelize, connectDB } = require('./config/db');
const { User } = require('./models');

async function seedAdmin() {
    await connectDB();
    await sequelize.sync();

    const existing = await User.findOne({ where: { email: 'agnipadmin@act.edu.in' } });
    if (existing) {
        console.log('Admin user already exists');
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('123456789', 10);

    await User.create({
        name: 'Agni Admin',
        email: 'agnipadmin@act.edu.in',
        department: 'Administration',
        year: 4,
        password: hashedPassword,
        role: 'admin'
    });

    console.log('Admin user created successfully');
    process.exit(0);
}

seedAdmin().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
