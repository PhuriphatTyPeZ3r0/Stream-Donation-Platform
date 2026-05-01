import { Request, Response } from 'express';
import { sql } from '../config/database';

// API: ดึงข้อมูลโปรไฟล์
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    try {
        const result = await sql`
            SELECT username, display_name, bio, avatar_url, theme_color 
            FROM users 
            WHERE id::text = ${userId}
        `;
        const user = result[0];
        
        if (!user) {
            res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' });
            return;
        }
        res.status(200).json({ data: user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// API: อัปเดตโปรไฟล์
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    const { userId, display_name, bio, avatar_url, theme_color } = req.body;
    try {
        const updatedUser = await sql`
            UPDATE users SET 
                display_name = ${display_name || null},
                bio = ${bio || null},
                avatar_url = ${avatar_url || null},
                theme_color = ${theme_color || '#3B82F6'},
                updated_at = CURRENT_TIMESTAMP
            WHERE id::text = ${userId}
            RETURNING id, display_name
        `;
        res.status(200).json({ message: 'อัปเดตโปรไฟล์สำเร็จ', data: updatedUser[0] });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'อัปเดตข้อมูลล้มเหลว' });
    }
};
