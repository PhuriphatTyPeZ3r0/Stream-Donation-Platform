'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
// ดึง Type ที่เราแชร์ไว้ตรงกลางมาใช้
import { DonationAlert } from '@stream-donation/shared-types'; 

// ขยาย Type เพื่อใส่ ID สำหรับเป็น React Key ในการคุมคิวแอนิเมชัน
interface OverlayAlert extends Omit<DonationAlert, 'id'> {
  id: string; // override timestamp-based id if needed Or just use the incoming
}

export default function OverlayPage({ params }: { params: { streamerId: string } }) {
  const [queue, setQueue] = useState<OverlayAlert[]>([]);
  const [currentAlert, setCurrentAlert] = useState<OverlayAlert | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Connection & Event Listener
  useEffect(() => {
    // โหลดเสียงแจ้งเตือน (เตรียมไฟล์เสียงไว้ที่ apps/frontend/public/sounds/alert.mp3)
    audioRef.current = new Audio('/sounds/alert.mp3');

    // เชื่อมต่อไปที่ service-overlay (Port: 3003) ตาม Architecture ที่เราวางไว้
    const wsUrl = process.env.NEXT_PUBLIC_WEBHOOK_WS_URL || 'http://localhost:3003';
    const socket: Socket = io(wsUrl);

    socket.on('connect', () => {
      console.log('Connected to Overlay WS');
      // เผื่ออนาคต: socket.emit('join-room', params.streamerId);
    });

    // ดักจับ Event ที่ตั้งชื่อไว้ใน service-overlay
    socket.on('trigger-alert', (data: DonationAlert) => {
      // ดันเข้าคิว (ป้องการจังหวะคนโดเนทรัวๆ พร้อมกัน)
      setQueue((prev) => [...prev, { ...data, id: Date.now().toString() }]);
    });

    return () => {
      socket.disconnect();
    };
  }, [params.streamerId]);

  // 2. Queue Manager (จัดการการแสดงผลทีละรายการ)
  useEffect(() => {
    if (queue.length > 0 && !currentAlert) {
      const nextAlert = queue[0];
      setCurrentAlert(nextAlert);
      setQueue((prev) => prev.slice(1));

      // เล่นเสียง
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }

      // แสดงแอนิเมชันค้างไว้ 5 วินาที แล้วสั่งปิดเพื่อรอคิวถัดไป
      setTimeout(() => {
        setCurrentAlert(null);
      }, 5000);
    }
  }, [queue, currentAlert]);

  // 3. Animation Configuration
  // ตั้งค่าความสมูทและลูกเล่นการสวิงให้ดูมีน้ำหนักและดึงดูดสายตา
  const alertVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.85, rotateX: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      rotateX: 0,
      transition: { type: 'spring', damping: 14, stiffness: 120, duration: 0.6 }
    },
    exit: { 
      opacity: 0, 
      y: -40, 
      scale: 0.9, 
      transition: { ease: 'easeInOut', duration: 0.4 } 
    }
  };

  return (
    // พื้นหลังโปร่งใสสำหรับ OBS
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-end justify-center pb-24">
      <AnimatePresence mode="wait">
        {currentAlert && (
          <motion.div
            key={currentAlert.id}
            variants={alertVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center max-w-2xl text-center"
          >
            {/* กล่องข้อความหลัก (เน้นความคมชัดของ Typography และเส้นสายที่ดุดัน) */}
            <div className="bg-zinc-900/90 backdrop-blur-md px-10 py-5 border-l-8 border-red-500 shadow-2xl mb-4 relative overflow-hidden transform skew-x-[-2deg]">
              {/* Effect แสงกวาด (Sweep) ด้านหลังตัวหนังสือ */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
              <h1 className="text-5xl font-black text-white tracking-tighter relative z-10">
                {currentAlert.senderName} 
                <span className="text-red-500 ml-4 drop-shadow-md">
                  {currentAlert.amount.toLocaleString()} ฿
                </span>
              </h1>
            </div>
            
            {/* กล่องข้อความโดเนท (เน้นความนุ่มนวลและอ่านง่าย) */}
            {currentAlert.message && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, type: 'spring', bounce: 0.4 }}
                className="bg-white/95 backdrop-blur-xl rounded-xl px-8 py-4 border-2 border-zinc-100 shadow-xl transform skew-x-[-2deg]"
              >
                <p className="text-3xl text-zinc-800 font-bold tracking-wide">
                  "{currentAlert.message}"
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}