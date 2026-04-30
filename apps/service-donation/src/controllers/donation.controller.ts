import { Request, Response } from 'express';
import { sql, poolPromise } from '../config/database';
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
        const pool = await poolPromise;

        // 1. ดึงการตั้งค่าของสตรีมเมอร์ (PromptPay ID และ ยอดขั้นต่ำ)
        const settingsResult = await pool.request()
            .input('StreamerId', sql.VarChar(50), streamerId)
            .execute('sp_GetStreamerPaymentInfo');

        const streamerInfo = settingsResult.recordset[0];

        if (!streamerInfo || !streamerInfo.PromptPayId) {
            res.status(404).json({ error: 'Streamer has not configured payment settings.' });
            return;
        }

        if (amount < streamerInfo.MinDonationAmount) {
            res.status(400).json({ error: `Minimum donation amount is ${streamerInfo.MinDonationAmount} THB` });
            return;
        }

        // 2. สร้าง String Payload ของ PromptPay
        const payload = generatePayload(streamerInfo.PromptPayId, { amount: Number(amount) });
        
        // 3. แปลง Payload เป็นรูปภาพ QR Code (Base64)
        // ตั้งค่า margin และสีให้สวยงามพร้อมแสดงผลบนเว็บ Next.js ของเรา
        const qrImageBase64 = await qrcode.toDataURL(payload, {
            margin: 2,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // 4. สร้าง Payment Reference ID สำหรับรอรับ Webhook
        const paymentRef = `TXN_${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;

        // 5. บันทึกข้อมูลลง Database เป็นสถานะ 'Pending'
        const insertResult = await pool.request()
            .input('StreamerId', sql.VarChar(50), streamerId)
            .input('SenderName', sql.NVarChar(100), senderName)
            .input('Message', sql.NVarChar(500), message || '')
            .input('Amount', sql.Decimal(18, 2), amount)
            .input('PaymentRef', sql.VarChar(100), paymentRef)
            .execute('sp_CreateDonation');

        if (insertResult.recordset[0] && insertResult.recordset[0].ResultStatus === 'SUCCESS') {
            // 6. ส่งรูปภาพ QR Code กลับไปให้ Frontend แสดงผล
            res.status(201).json({
                message: 'Donation QR Code generated successfully',
                data: {
                    paymentRef: paymentRef,
                    qrImageBase64: qrImageBase64,
                    amount: amount
                }
            });
        } else {
            res.status(500).json({ error: 'Failed to create donation record' });
        }

    } catch (error: any) {
        console.error('Error generating donation QR:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getDonationHistory = async (req: Request, res: Response): Promise<void> => {
    const { streamerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!streamerId) {
        res.status(400).json({ error: 'Streamer ID is required' });
        return;
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('StreamerId', sql.VarChar(50), streamerId)
            .input('Limit', sql.Int, limit)
            .execute('sp_GetRecentSuccessfulDonations');
            
        res.status(200).json({
            message: 'Donation history fetched successfully',
            data: result.recordset
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
        const pool = await poolPromise;
        const result = await pool.request()
            .input('PaymentRef', sql.VarChar(100), paymentRef)
            .query('SELECT Status FROM Donations WHERE PaymentRef = @PaymentRef');

        if (result.recordset.length === 0) {
            res.status(404).json({ error: 'Donation not found' });
            return;
        }

        const status = result.recordset[0].Status;
        
        res.status(200).json({ 
            data: { 
                paymentRef, 
                status 
            } 
        });

    } catch (error: any) {
        console.error('Error fetching donation status:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
