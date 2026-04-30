import express from 'express';
import Redis from 'ioredis';
import sql from 'mssql';
import { DonationAlert } from '@stream-donation/shared-types';

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

const redisPublisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ตั้งค่า SQL Config (ใช้ msnodesqlv8 หรือตั้งค่าตาม Docker)
const sqlConfig: sql.config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrong!Passw0rd', // ใช้รหัสผ่านจาก docker-compose
    database: process.env.DB_NAME || 'StreamDonationDB',
    server: process.env.DB_SERVER || 'localhost',
    options: { encrypt: true, trustServerCertificate: true }
};

app.post('/webhook/payment', async (req, res) => {
    const { paymentRef, status } = req.body;
    try {
        const pool = await sql.connect(sqlConfig);
        // ... (โค้ดเรียก Stored Procedure แบบเต็มอยู่ใน Step 2) ...
        
        // จำลองข้อมูลหลังจาก DB อัปเดตสำเร็จ
        const eventData: DonationAlert = {
            id: Date.now().toString(),
            senderName: 'ผู้ไม่ประสงค์ออกนาม',
            message: 'สู้ๆ ครับ',
            amount: 500,
            timestamp: new Date().toISOString()
        };

        // ยิงข้อมูลเข้า Redis Channel 'DONATION_ALERTS'
        await redisPublisher.publish('DONATION_ALERTS', JSON.stringify(eventData));
        console.log('[Webhook] Published to Redis:', eventData);

        res.status(200).send('Webhook Processed');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Error');
    }
});

app.listen(port, () => {
    console.log(`Webhook Service running on port ${port}`);
});