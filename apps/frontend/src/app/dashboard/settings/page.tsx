'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [promptPayId, setPromptPayId] = useState('');
  const [minDonation, setMinDonation] = useState(1);
  const [goalAmount, setGoalAmount] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Mock Streamer ID (ในการใช้งานจริงควรดึงจาก Session/Auth)
  const streamerId = 'STREAMER_01';
  const API_URL = process.env.NEXT_PUBLIC_DONATION_API_URL || 'http://localhost:3001';

  // ดึงข้อมูลเดิมมาแสดงเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/${streamerId}`);
        const result = await res.json();
        
        if (result?.data) {
          setPromptPayId(result.data.PromptPayId || '');
          setMinDonation(result.data.MinDonationAmount || 1);
          setGoalAmount(result.data.GoalAmount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [API_URL, streamerId]);

  // ฟังก์ชันสำหรับบันทึกข้อมูล
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId,
          promptPayId,
          minDonationAmount: minDonation,
          goalAmount: goalAmount,
        }),
      });

      if (res.ok) {
        setMessage({ text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', type: 'success' });
      } else {
        setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', type: 'error' });
    } finally {
      setIsSaving(false);
      // ซ่อนข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลดการตั้งค่า...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">ตั้งค่าระบบโดเนท (Settings)</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* PromptPay ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เบอร์พร้อมเพย์ (PromptPay ID)
              </label>
              <input
                type="text"
                required
                placeholder="เบอร์โทรศัพท์ หรือ เลขบัตรประชาชน"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={promptPayId}
                onChange={(e) => setPromptPayId(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-2">ระบุเบอร์โทรศัพท์ที่ผูกพร้อมเพย์เพื่อใช้สร้าง QR Code รับเงิน</p>
            </div>

            {/* Min Donation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ยอดโดเนทขั้นต่ำที่แจ้งเตือน (บาท)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={minDonation}
                onChange={(e) => setMinDonation(parseFloat(e.target.value))}
              />
            </div>

            {/* Goal Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                เป้าหมายการโดเนท (Donation Goal)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={goalAmount}
                onChange={(e) => setGoalAmount(parseFloat(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-2">ใส่ 0 หากไม่ต้องการแสดงแถบเป้าหมาย</p>
            </div>

            {/* ข้อความแจ้งเตือนผลการบันทึก */}
            {message.text && (
              <div className={`p-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
              </div>
            )}

            {/* ปุ่มบันทึก */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                  isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
