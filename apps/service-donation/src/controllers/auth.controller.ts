import { Request, Response } from 'express';
import { sql, poolPromise } from '../config/database';
import bcrypt from 'bcryptjs';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        return;
    }

    try {
        // เข้ารหัสผ่าน
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Email', sql.VarChar(100), email)
            .input('Username', sql.VarChar(50), username)
            .input('PasswordHash', sql.VarChar(255), passwordHash)
            .execute('sp_RegisterUser');

        const dbResult = result.recordset[0];

        if (dbResult.ResultStatus === 'SUCCESS') {
            res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user: { id: dbResult.Id, email, username } });
        } else {
            res.status(400).json({ error: dbResult.Message });
        }

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
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Email', sql.VarChar(100), email)
            .query('SELECT Id, Email, Username, PasswordHash FROM Users WHERE Email = @Email');

        const user = result.recordset[0];

        if (!user) {
            res.status(401).json({ error: 'ไม่พบบัญชีผู้ใช้งาน' });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.PasswordHash);
        if (!isValidPassword) {
            res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
            return;
        }

        res.status(200).json({ user: { id: user.Id, email: user.Email, username: user.Username } });

    } catch (error: any) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
    }
};
