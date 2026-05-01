'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const API_URL = process.env.NEXT_PUBLIC_DONATION_API_URL;

  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    theme_color: '#3B82F6',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      fetch(`${API_URL}/api/profile/${userId}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.data) {
            setFormData({
              display_name: result.data.display_name || '',
              bio: result.data.bio || '',
              avatar_url: result.data.avatar_url || '',
              theme_color: result.data.theme_color || '#3B82F6',
            });
          }
        });
    }
  }, [userId, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData }),
      });
      alert('บันทึกโปรไฟล์สำเร็จ!');
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">จัดการโปรไฟล์</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ส่วนแสดงรูปภาพ (Preview) */}
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
              {formData.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">รูปภาพ</div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">ลิงก์รูปโปรไฟล์ (URL)</label>
              <input 
                type="text" 
                value={formData.avatar_url}
                onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://example.com/my-avatar.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อที่ใช้แสดง (Display Name)</label>
            <input 
              type="text" 
              value={formData.display_name}
              onChange={(e) => setFormData({...formData, display_name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">แนะนำตัวสั้นๆ (Bio)</label>
            <textarea 
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">สีธีมหน้าเว็บ (Theme Color)</label>
            <div className="flex items-center space-x-4">
              <input 
                type="color" 
                value={formData.theme_color}
                onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                className="w-14 h-14 p-1 rounded-xl border border-gray-200 cursor-pointer"
              />
              <span className="text-gray-500 uppercase">{formData.theme_color}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </form>
      </div>
    </div>
  );
}
