import { Request, Response } from 'express';
import { sql } from '../config/database';
import generatePayload from 'promptpay-qr';
import qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export const createDonation = async (req: Request, res: Response): Promise<void> => {
    const { streamerId, senderName, message, amount } = req.body;

    if (!streamerId || !senderName || !amount || amount <= 0) {
        res.status(400).json({ error: 'Invalid input data' });
        return;
    }

    try {
        // 1. ดึงการตั้งค่าของสตรีมเมอร์
        const settingsResult = await sql`
            SELECT promptpay_id, min_donation_amount 
            FROM streamer_settings 
            WHERE streamer_id = ${streamerId}
        `;

        const streamerInfo = settingsResult[0];

        if (!streamerInfo || !streamerInfo.promptpay_id) {
            res.status(404).json({ error: 'Streamer has not configured payment settings.' });
            return;
        }

        if (amount < streamerInfo.min_donation_amount) {
            res.status(400).json({ error: `Minimum donation amount is ${streamerInfo.min_donation_amount} THB` });
            return;
        }

        // 2. สร้าง String Payload ของ PromptPay
        const payload = generatePayload(streamerInfo.promptpay_id, { amount: Number(amount) });
        
        // 3. แปลง Payload เป็นรูปภาพ QR Code (Base64)
        const qrImageBase64 = await qrcode.toDataURL(payload, {
            margin: 2,
            width: 300,
            color: { dark: '#000000', light: '#FFFFFF' }
        });

        // 4. สร้าง Payment Reference ID
        const paymentRef = `TXN_${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;

        // 5. บันทึกข้อมูลลง Database เป็นสถานะ 'PENDING'
        await sql`
            INSERT INTO donations (streamer_id, sender_name, message, amount, payment_ref, status) 
            VALUES (${streamerId}, ${senderName}, ${message || ''}, ${amount}, ${paymentRef}, 'PENDING')
        `;

        // 6. ส่งรูปภาพ QR Code กลับไปให้ Frontend
        res.status(201).json({
            message: 'Donation QR Code generated successfully',
            data: { paymentRef, qrImageBase64, amount }
        });

    } catch (error: any) {
        console.error('Error generating donation QR:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDonationHistory = async (req: Request, res: Response): Promise<void> => {
    const { streamerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    if (!streamerId) {
        res.status(400).json({ error: 'Streamer ID is required' });
        return;
    }

    try {
        const result = await sql`
            SELECT id, sender_name, message, amount, payment_ref, created_at 
            FROM donations 
            WHERE streamer_id = ${streamerId} AND status = 'SUCCESS' 
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        const countResult = await sql`
            SELECT COUNT(*) as total 
            FROM donations 
            WHERE streamer_id = ${streamerId} AND status = 'SUCCESS'
        `;
        
        const totalCount = parseInt(countResult[0].total, 10);

        const mappedData = result.map(row => ({
            Id: row.id,
            SenderName: row.sender_name,
            Message: row.message,
            Amount: row.amount,
            PaymentRef: row.payment_ref,
            CreatedAt: row.created_at
        }));

        res.status(200).json({
            message: 'Donation history fetched successfully',
            data: mappedData,
            meta: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching history:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDonationStatus = async (req: Request, res: Response): Promise<void> => {
    const { paymentRef } = req.params;

    if (!paymentRef) {
        res.status(400).json({ error: 'Payment Reference is required' });
        return;
    }

    try {
        const result = await sql`
            SELECT status FROM donations WHERE payment_ref = ${paymentRef}
        `;

        if (result.length === 0) {
            res.status(404).json({ error: 'Donation not found' });
            return;
        }

        res.status(200).json({ 
            data: { 
                paymentRef, 
                status: result[0].status 
            } 
        });

    } catch (error: any) {
        console.error('Error fetching donation status:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
