const mongoose = require('mongoose');
require('dotenv').config();

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Available Databases:');
        for (const dbInfo of dbs.databases) {
            console.log(`\n--- DB: ${dbInfo.name} ---`);
            const tempConn = await mongoose.createConnection(process.env.MONGO_URI, { dbName: dbInfo.name }).asPromise();
            const collections = await tempConn.db.listCollections().toArray();
            for (const col of collections) {
                const count = await tempConn.db.collection(col.name).countDocuments();
                console.log(` - ${col.name}: ${count} documents`);
            }
            await tempConn.close();
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkDB();
