'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [promptPayId, setPromptPayId] = useState('');
  const [minDonation, setMinDonation] = useState(10);
  const [goalAmount, setGoalAmount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Mock Streamer ID (รอผูกกับ NextAuth.js ในอนาคต)
  const streamerId = 'STREAMER_01'; 
  const API_URL = process.env.NEXT_PUBLIC_DONATION_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // ดึงข้อมูลเดิมมาแสดง
    fetch(`${API_URL}/api/settings/${streamerId}`)
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setPromptPayId(result.data.PromptPayId);
          setMinDonation(result.data.MinDonationAmount);
          setGoalAmount(result.data.GoalAmount);
        }
      });
  }, [API_URL, streamerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg('');

    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamerId,
          promptPayId,
          minDonationAmount: minDonation,
          goalAmount,
        }),
      });

      if (res.ok) {
        setStatusMsg('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว');
      } else {
        setStatusMsg('❌ เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      setStatusMsg('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">ตั้งค่าระบบรับโดเนท</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">เบอร์พร้อมเพย์ / เลขบัตรประชาชน</label>
            <input 
              type="text" 
              required
              value={promptPayId}
              onChange={e => setPromptPayId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="08X-XXX-XXXX"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">โดเนทขั้นต่ำ (บาท)</label>
              <input 
                type="number" 
                min="1"
                value={minDonation}
                onChange={e => setMinDonation(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">เป้าหมายโดเนท (บาท)</label>
              <input 
                type="number" 
                min="0"
                value={goalAmount}
                onChange={e => setGoalAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {statusMsg && (
            <div className={`p-4 rounded-lg font-medium text-center ${statusMsg.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {statusMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:bg-blue-300"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </form>
      </div>
    </div>
  );
}
