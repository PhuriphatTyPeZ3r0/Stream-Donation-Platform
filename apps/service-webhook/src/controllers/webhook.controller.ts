import { Request, Response } from 'express';
import { sql } from '../config/database';
import Redis from 'ioredis';
import { DonationEvent } from '@stream-donation/shared-types';

// ตั้งค่า Redis Publisher
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPublisher = new Redis(redisUrl);

export const handlePaymentCallback = async (req: Request, res: Response): Promise<void> => {
    const { paymentRef, status } = req.body;

    if (!paymentRef || !status) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try {
        // อัปเดตสถานะ ถ้าสถานะเดิมยังไม่ใช่ SUCCESS
        const result = await sql`
            UPDATE donations 
            SET status = ${status}, updated_at = CURRENT_TIMESTAMP 
            WHERE payment_ref = ${paymentRef} AND status != 'SUCCESS' 
            RETURNING streamer_id, sender_name, message, amount
        `;

        if (result.length > 0) {
            const dbResult = result[0];
            
            // ถ้าอัปเดตสำเร็จ และสถานะเป็น SUCCESS ให้ยิง Redis
            if (status === 'SUCCESS') {
                const eventData: DonationEvent = {
                    streamerId: dbResult.streamer_id,
                    senderName: dbResult.sender_name,
                    message: dbResult.message,
                    amount: dbResult.amount,
                    timestamp: new Date().toISOString()
                };

                // Publish เข้า Channel ที่ตกลงกันไว้
                await redisPublisher.publish('DONATION_ALERTS', JSON.stringify(eventData));
                console.log(`[Webhook] Success! Broadcasted donation from ${dbResult.sender_name} to Redis.`);
            }
        } else {
            console.log(`[Webhook] Ignored: Transaction ${paymentRef} already processed or not found.`);
        }

        // 3. ตอบกลับ Gateway
        res.status(200).send('OK');

    } catch (error: any) {
        console.error('[Webhook Error]:', error.message);
        res.status(500).send('Internal Server Error'); 
    }
};
