'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface StreamerProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme_color: string;
  min_donation_amount: number;
}

export default function PublicDonationPage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<StreamerProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Form States
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  
  // UI States
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=Form, 2=QR, 3=Success
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [qrData, setQrData] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_DONATION_API_URL || 'http://localhost:3001';

  // 1. ดึงข้อมูล Profile ทันทีที่โหลดหน้าเว็บ
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/streamer/${params.username}`);
        const result = await res.json();
        if (result.data) {
          setProfile(result.data);
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      } finally {
        setIsProfileLoading(false);
      }
    };
    fetchProfile();
  }, [params.username, API_URL]);

  // 2. จำลองระบบ Long Polling เพื่อเช็คสถานะการโอนเงิน (จำลองการเปลี่ยนไป Step 3)
  useEffect(() => {
    if (step === 2 && qrData?.paymentRef) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/donations/status/${qrData.paymentRef}`);
          const result = await res.json();
          if (result.data?.status === 'SUCCESS') {
            setStep(3); // ย้ายไปหน้า Success
            clearInterval(interval);
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, qrData, API_URL]);

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const minAmount = profile?.min_donation_amount || 1;

    if (!senderName || !amount || amount < minAmount) {
      setErrorMsg(`กรุณากรอกข้อมูลให้ครบถ้วน และขั้นต่ำ ${minAmount} บาท`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId: profile?.id, // ใช้ ID ที่ได้จาก Profile
          senderName,
          message,
          amount: Number(amount),
        }),
      });

      const result = await res.json();
      if (res.ok) {
        setQrData(result.data);
        setStep(2);
      } else {
        setErrorMsg(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('เชื่อมต่อระบบล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">ไม่พบสตรีมเมอร์ท่านนี้</div>;
  }

  // ใช้ Theme Color ที่สตรีมเมอร์ตั้งไว้
  const themeColor = profile.theme_color || '#3B82F6';

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4" style={{ backgroundColor: `${themeColor}15` }}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden relative">
        
        {/* Header Cover & Profile Picture */}
        <div className="h-32 w-full" style={{ backgroundColor: themeColor }}></div>
        <div className="px-6 pb-6 relative text-center">
          <div className="w-24 h-24 mx-auto -mt-12 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-3xl">🎮</div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-800">{profile.display_name || profile.username}</h1>
          {profile.bio && <p className="text-gray-500 mt-2 text-sm px-4">{profile.bio}</p>}
        </div>

        <div className="p-8 pt-0">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Form */}
            {step === 1 && (
              <motion.form 
                key="form"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                onSubmit={handleDonateSubmit} className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อของคุณ</label>
                  <input type="text" required value={senderName} onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties} placeholder="นินจาสายเปย์" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ข้อความ</label>
                  <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 resize-none"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                    placeholder="สู้ๆ นะครับ!" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">จำนวนเงิน (ขั้นต่ำ {profile.min_donation_amount || 1} ฿)</label>
                  <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 text-xl font-bold"
                    style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                    placeholder="0.00" />
                </div>
                
                {errorMsg && <div className="text-red-500 text-sm font-medium text-center">{errorMsg}</div>}

                <button type="submit" disabled={isLoading}
                  className="w-full py-4 rounded-xl font-bold text-white transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: themeColor }}>
                  {isLoading ? 'กำลังประมวลผล...' : 'สนับสนุนสตรีมเมอร์'}
                </button>
              </motion.form>
            )}

            {/* Step 2: QR Code */}
            {step === 2 && qrData && (
              <motion.div key="qr" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                <h2 className="text-xl font-bold text-gray-800">สแกนเพื่อโอนเงิน</h2>
                <div className="inline-block p-4 bg-white border-2 border-dashed border-gray-300 rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrData.qrImageBase64} alt="QR Code" className="w-48 h-48 object-contain" />
                </div>
                <p className="text-gray-500">ยอดเงิน: <span className="font-bold text-lg" style={{ color: themeColor }}>{qrData.amount.toLocaleString()} ฿</span></p>
                <div className="text-xs text-gray-400 bg-gray-50 py-2 rounded-lg">Ref: {qrData.paymentRef}</div>
                <button type="button" onClick={() => setStep(1)} className="text-sm underline text-gray-500 hover:text-gray-700">ยกเลิก</button>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <CheckCircle2 className="w-24 h-24 mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">ชำระเงินสำเร็จ!</h2>
                <p className="text-gray-500 mt-2">ขอบคุณที่สนับสนุน {profile.display_name} นะครับ</p>
                <button type="button" onClick={() => { setStep(1); setAmount(''); setMessage(''); }} 
                  className="mt-6 px-6 py-2 rounded-full font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  โอนอีกครั้ง
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
