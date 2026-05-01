import { Request, Response } from 'express';
import { sql, poolPromise } from '../config/database';
import Redis from 'ioredis';
import { DonationEvent } from '@stream-donation/shared-types';

// ตั้งค่า Redis Publisher
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPublisher = new Redis(redisUrl);

export const handlePaymentCallback = async (req: Request, res: Response): Promise<void> => {
    // หมายเหตุ: ใน Production จริง ต้องมีการ Validate Signature (HMAC) เพื่อป้องกันคนปลอมแปลง Webhook
    const { paymentRef, status } = req.body;

    if (!paymentRef || !status) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try {
        const pool = await poolPromise;

        // 1. เรียกใช้ SP เพื่ออัปเดต Database
        const result = await pool.request()
            .input('PaymentRef', sql.VarChar(100), paymentRef)
            .input('NewStatus', sql.VarChar(20), status)
            .execute('sp_UpdateDonationStatus');

        const dbResult = result.recordset[0];

        // 2. ถ้าสถานะเปลี่ยนเป็น Success และดึงข้อมูลกลับมาได้ ให้ยิง Redis
        if (dbResult && dbResult.ResultStatus === 'SUCCESS') {
            const eventData: DonationEvent = {
                streamerId: dbResult.StreamerId,
                senderName: dbResult.SenderName,
                message: dbResult.Message,
                amount: dbResult.Amount,
                timestamp: new Date().toISOString()
            };

            // Publish เข้า Channel ที่ตกลงกันไว้
            await redisPublisher.publish('DONATION_ALERTS', JSON.stringify(eventData));
            console.log(`[Webhook] Success! Broadcasted donation from ${dbResult.SenderName} to Redis.`);
        } else if (dbResult && dbResult.ResultStatus === 'IGNORED') {
            console.log(`[Webhook] Ignored: Transaction ${paymentRef} already processed or not found.`);
        }

        // 3. ตอบกลับ Gateway ให้อย่างรวดเร็วด้วย Status 200 (อย่าให้เกิน 2-3 วินาทีตามกฎของ Gateway ส่วนใหญ่)
        res.status(200).send('OK');

    } catch (error: any) {
        console.error('[Webhook Error]:', error.message);
        // บาง Payment Gateway อาจจะยิงซ้ำถ้ารับ 500 กลับไป
        res.status(500).send('Internal Server Error'); 
    }
};
