import { Request, Response } from 'express';
import { sql } from '../config/database';

// ดึงข้อมูลการตั้งค่า
export const getSettings = async (req: Request, res: Response): Promise<void> => {
    const { streamerId } = req.params;
    try {
        const result = await sql`
            SELECT promptpay_id, min_donation_amount, goal_amount 
            FROM streamer_settings 
            WHERE streamer_id = ${streamerId}
        `;

        if (result.length > 0) {
            const row = result[0];
            res.status(200).json({
                data: {
                    PromptPayId: row.promptpay_id,
                    MinDonationAmount: row.min_donation_amount,
                    GoalAmount: row.goal_amount
                }
            });
        } else {
            res.status(200).json({ data: null });
        }
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
        await sql`
            INSERT INTO streamer_settings (streamer_id, promptpay_id, min_donation_amount, goal_amount) 
            VALUES (${streamerId}, ${promptPayId}, ${minDonationAmount || 1.00}, ${goalAmount || 0.00}) 
            ON CONFLICT (streamer_id) 
            DO UPDATE SET promptpay_id = EXCLUDED.promptpay_id, 
                          min_donation_amount = EXCLUDED.min_donation_amount, 
                          goal_amount = EXCLUDED.goal_amount, 
                          updated_at = CURRENT_TIMESTAMP
        `;

        res.status(200).json({ message: 'Settings saved successfully' });
    } catch (error: any) {
        console.error('Error saving settings:', error.message);
        res.status(500).json({ error: 'Failed to save settings' });
    }
};
