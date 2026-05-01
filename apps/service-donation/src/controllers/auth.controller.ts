import { Request, Response } from 'express';
import { sql } from '../config/database';
import bcrypt from 'bcryptjs';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Check if user exists
        const checkResult = await sql`
            SELECT 1 FROM users WHERE email = ${email} OR username = ${username}
        `;

        if (checkResult.length > 0) {
            res.status(400).json({ error: 'Email or Username already exists' });
            return;
        }

        // Insert new user
        const insertResult = await sql`
            INSERT INTO users (email, username, password_hash) 
            VALUES (${email}, ${username}, ${passwordHash}) 
            RETURNING id, email, username
        `;

        const newUser = insertResult[0];
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user: { id: newUser.id, email, username } });

    } catch (error: any) {
        console.error('Register Error:', error.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
        return;
    }

    try {
        const result = await sql`
            SELECT id, email, username, password_hash FROM users WHERE email = ${email}
        `;
        const user = result[0];

        if (!user) {
            res.status(401).json({ error: 'ไม่พบบัญชีผู้ใช้งาน' });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
            return;
        }

        res.status(200).json({ user: { id: user.id, email: user.email, username: user.username } });

    } catch (error: any) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
    }
};
