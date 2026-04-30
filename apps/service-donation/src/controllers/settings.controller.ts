import { Request, Response } from 'express';
import { sql, poolPromise } from '../config/database';

// ดึงข้อมูลการตั้งค่า
export const getSettings = async (req: Request, res: Response): Promise<void> => {
    const { streamerId } = req.params;
    try {
        const pool = await poolPromise;
        // ใช้ Direct Query ง่ายๆ สำหรับดึงข้อมูลทั้งหมดมาแสดงบน Form
        const result = await pool.request()
            .input('StreamerId', sql.VarChar(50), streamerId)
            .query('SELECT PromptPayId, MinDonationAmount, GoalAmount FROM StreamerSettings WHERE StreamerId = @StreamerId');

        res.status(200).json({ data: result.recordset[0] || null });
    } catch (error: any) {
        console.error('Error fetching settings:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// บันทึกหรืออัปเดตการตั้งค่า
export const saveSettings = async (req: Request, res: Response): Promise<void> => {
    const { streamerId, promptPayId, minDonationAmount, goalAmount } = req.body;

    if (!streamerId || !promptPayId) {
        res.status(400).json({ error: 'StreamerId and PromptPayId are required' });
        return;
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('StreamerId', sql.VarChar(50), streamerId)
            .input('PromptPayId', sql.VarChar(20), promptPayId)
            .input('MinDonationAmount', sql.Decimal(18, 2), minDonationAmount || 1.00)
            .input('GoalAmount', sql.Decimal(18, 2), goalAmount || 0.00)
            .execute('sp_UpsertStreamerSettings');

        res.status(200).json({ message: 'Settings saved successfully' });
    } catch (error: any) {
        console.error('Error saving settings:', error.message);
        res.status(500).json({ error: 'Failed to save settings' });
    }
};
