import sql from 'mssql';

const sqlConfig: sql.config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrong!Passw0rd',
    database: process.env.DB_NAME || 'StreamDonationDB',
    server: process.env.DB_SERVER || 'localhost',
    options: { encrypt: true, trustServerCertificate: true }
};

export const poolPromise = sql.connect(sqlConfig)
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

export { sql };
