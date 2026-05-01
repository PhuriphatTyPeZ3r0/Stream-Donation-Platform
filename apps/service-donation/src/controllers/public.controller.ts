import { Request, Response } from 'express';
import { sql } from '../config/database'; // ใช้ postgres.js

export const getPublicStreamerProfile = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;
    try {
        // ดึงข้อมูลจากตาราง users (เฉพาะฟิลด์ที่เปิดเผยได้) 
        // และ join กับ streamer_settings เพื่อเอายอดขั้นต่ำ (ถ้ามี)
        const result = await sql`
            SELECT u.id, u.username, u.display_name, u.bio, u.avatar_url, u.theme_color,
                   s.min_donation_amount
            FROM users u
            LEFT JOIN streamer_settings s ON u.id::text = s.streamer_id
            WHERE u.username = ${username}
        `;

        const streamer = result[0];

        if (!streamer) {
            res.status(404).json({ error: 'ไม่พบหน้าสตรีมเมอร์ที่คุณกำลังค้นหา' });
            return;
        }

        res.status(200).json({ data: streamer });
    } catch (error: any) {
        console.error('Error fetching public profile:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
