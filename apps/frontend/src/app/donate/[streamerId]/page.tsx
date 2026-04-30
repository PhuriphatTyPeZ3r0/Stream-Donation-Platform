'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// กำหนด Type สำหรับ Response ที่ได้จาก Backend
interface QrData {
  paymentRef: string;
  qrImageBase64: string;
  amount: number;
}

export default function DonatePage({ params }: { params: { streamerId: string } }) {
  // Form States
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  
  // UI States
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = Form, 2 = QR Code, 3 = Success
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [qrData, setQrData] = useState<QrData | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_DONATION_API_URL || 'http://localhost:3001';

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!senderName || !amount || amount <= 0) {
      setErrorMsg('กรุณากรอกชื่อและจำนวนเงินให้ถูกต้อง');
      return;
    }

    setIsLoading(true);

    try {
      // ยิง API ไปที่ Donation Service เพื่อสร้าง QR Code
      const res = await fetch(`${API_URL}/api/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId: params.streamerId,
          senderName,
          message,
          amount: Number(amount),
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setQrData(result.data);
        setStep(2); // เปลี่ยนไปหน้าแสดง QR Code
      } else {
        setErrorMsg(result.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMsg('ไม่สามารถเชื่อมต่อกับระบบชำระเงินได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Long Polling สำหรับเช็คสถานะการโอนเงิน ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (step === 2 && qrData?.paymentRef) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/donations/status/${qrData.paymentRef}`);
          if (res.ok) {
            const result = await res.json();
            if (result.data && result.data.status === 'SUCCESS') {
              setStep(3); // เปลี่ยนไปหน้า Success
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 3000); // ตรวจสอบทุกๆ 3 วินาที
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, qrData, API_URL]);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header สตรีมเมอร์ */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl backdrop-blur-sm border-2 border-white/50 shadow-inner">
            🎮
          </div>
          <h1 className="text-2xl font-bold tracking-wide">สนับสนุนสตรีมเมอร์</h1>
          <p className="text-blue-100 text-sm mt-1">@{params.streamerId}</p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            
            {/* --- STEP 1: หน้าฟอร์มกรอกข้อมูล --- */}
            {step === 1 && (
              <motion.form 
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleDonateSubmit} 
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อของคุณ (แสดงบนจอ)</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 focus:bg-white"
                    placeholder="เช่น นินจา สายเปย์"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ข้อความถึงสตรีมเมอร์</label>
                  <textarea
                    maxLength={150}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 focus:bg-white resize-none"
                    placeholder="พิมพ์ข้อความให้กำลังใจ..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition bg-gray-50 focus:bg-white text-xl font-bold text-blue-600"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>

                {errorMsg && (
                  <div className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all transform active:scale-[0.98] ${
                    isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
                  }`}
                >
                  {isLoading ? 'กำลังสร้าง QR Code...' : 'ตกลง'}
                </button>
              </motion.form>
            )}

            {/* --- STEP 2: หน้าแสดง QR Code --- */}
            {step === 2 && qrData && (
              <motion.div 
                key="qr"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <h2 className="text-xl font-bold text-gray-800">สแกนเพื่อจ่ายเงิน</h2>
                <p className="text-gray-500 text-sm">ยอดเงิน: <span className="font-bold text-blue-600 text-lg">{qrData.amount.toLocaleString()} บาท</span></p>
                
                {/* กล่องใส่ QR Code */}
                <div className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl shadow-sm relative">
                  <img 
                    src={qrData.qrImageBase64} 
                    alt="PromptPay QR Code" 
                    className="w-48 h-48 object-contain"
                  />
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center opacity-0 hover:opacity-100 transition duration-300">
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">กำลังรอรับยอด...</span>
                  </div>
                </div>

                <div className="w-full bg-blue-50 text-blue-800 text-xs py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Ref: {qrData.paymentRef}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1); // ย้อนกลับไปหน้าฟอร์ม
                    setAmount('');
                    setMessage('');
                  }}
                  className="mt-4 text-gray-500 hover:text-gray-800 font-medium underline text-sm"
                >
                  ยกเลิก หรือ โอนเงินใหม่
                </button>
              </motion.div>
            )}

            {/* --- STEP 3: หน้าชำระเงินสำเร็จ --- */}
            {step === 3 && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-5 py-6"
              >
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-5xl mb-2 shadow-lg shadow-green-100">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    ✓
                  </motion.div>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-800">โอนเงินสำเร็จ!</h2>
                <p className="text-gray-500 text-sm">ขอบคุณที่สนับสนุนสตรีมเมอร์<br/>ข้อความของคุณจะขึ้นบนหน้าจอเร็วๆ นี้</p>
                
                <button
                  type="button"
                  onClick={() => {
                    setStep(1); // กลับไปเปย์ต่อ
                    setAmount('');
                    setMessage('');
                    setSenderName('');
                  }}
                  className="mt-6 w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-all"
                >
                  สนับสนุนอีกครั้ง
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}