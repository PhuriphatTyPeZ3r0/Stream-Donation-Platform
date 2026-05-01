'use client';

import { LogOut, Wallet, LayoutDashboard, History, Settings } from 'lucide-react';

export default function DashboardOverviewPage() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">ภาพรวม (Overview)</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 text-lg">กำลังเตรียมหน้าสรุปสถิติและ Progress Bar เร็วๆ นี้...</p>
      </div>
    </div>
  );
}