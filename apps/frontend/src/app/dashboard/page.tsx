'use client';

import { useEffect, useState } from 'react';

// สร้าง Interface ให้ตรงกับข้อมูลที่ได้จาก Database
interface DonationRecord {
  Id: string;
  SenderName: string;
  Message: string;
  Amount: number;
  CreatedAt: string;
}

export default function DashboardPage() {
  const [history, setHistory] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // สมมติว่า Streamer ล็อกอินเข้ามาแล้วได้ ID นี้ (ในงานจริงดึงจาก Session/JWT)
  const streamerId = 'STREAMER_01'; 

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // เรียก API ไปที่ Donation Service (Port 3001)
      const res = await fetch(`http://localhost:3001/api/donations/history/${streamerId}`);
      const result = await res.json();
      
      if (res.ok) {
        setHistory(result.data);
      } else {
        console.error('Failed to fetch:', result.error);
      }
    } catch (error) {
      console.error('API connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ฟังก์ชันแปลงวันที่ให้เป็นรูปแบบที่อ่านง่าย
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ประวัติการโดเนท (Donation History)</h1>
          <button 
            onClick={fetchHistory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            รีเฟรชข้อมูล
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ยังไม่มีประวัติการโดเนท</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-4 px-6 font-semibold">วัน/เวลา</th>
                  <th className="py-4 px-6 font-semibold">ชื่อผู้ส่ง</th>
                  <th className="py-4 px-6 font-semibold">ข้อความ</th>
                  <th className="py-4 px-6 font-semibold text-right">จำนวนเงิน (฿)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-md">
                {history.map((record) => (
                  <tr key={record.Id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.CreatedAt)}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {record.SenderName}
                    </td>
                    <td className="py-4 px-6 text-gray-600 max-w-xs truncate">
                      {record.Message || '-'}
                    </td>
                    <td className="py-4 px-6 font-bold text-green-600 text-right">
                      {record.Amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}