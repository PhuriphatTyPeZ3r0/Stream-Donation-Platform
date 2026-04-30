import { Server } from 'socket.io';
import http from 'http';
import Redis from 'ioredis';
import { DonationAlert } from '@stream-donation/shared-types';

const port = process.env.PORT || 3003;
const httpServer = http.createServer();

const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

io.on('connection', (socket) => {
    console.log(`[Socket] Client Connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`[Socket] Disconnected: ${socket.id}`));
});

redisSubscriber.subscribe('DONATION_ALERTS', (err, count) => {
    if (err) console.error('[Redis] Error:', err);
    else console.log(`[Redis] Subscribed. Ready for alerts.`);
});

redisSubscriber.on('message', (channel, message) => {
    if (channel === 'DONATION_ALERTS') {
        const eventData: DonationAlert = JSON.parse(message);
        console.log(`[Redis -> OBS] Forwarding alert for: ${eventData.senderName}`);
        
        // ส่งต่อให้หน้าจอ OBS (Next.js) ที่กำลังเชื่อมต่ออยู่ทั้งหมด
        // ใช้ event name 'trigger-alert' ให้ตรงกับที่ทำไว้ใน Frontend ก่อนหน้านี้
        io.emit('trigger-alert', eventData);
    }
});

httpServer.listen(port, () => {
    console.log(`Overlay WebSocket Service running on port ${port}`);
});