'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, Settings, LogOut, Wallet, UserCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // กำหนดรายการเมนู
  const menuItems = [
    { name: 'ภาพรวม (Overview)', href: '/dashboard', icon: LayoutDashboard },
    { name: 'ประวัติโดเนท (History)', href: '/dashboard/history', icon: History },
    { name: 'ตั้งค่าระบบ (Settings)', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Sidebar Section */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex sticky top-0 h-screen">
        
        {/* Logo / Branding */}
        <div className="h-20 flex items-center px-8 border-b border-gray-100">
          <Wallet className="w-8 h-8 text-blue-600 mr-3" />
          <span className="text-xl font-black text-gray-800 tracking-tight">StreamPay</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-bold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout Section */}
        <div className="p-4 border-t border-gray-100">
          {session?.user && (
            <div className="flex items-center px-4 py-3 mb-2 bg-gray-50 rounded-xl">
              <UserCircle className="w-8 h-8 text-blue-500 mr-3" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate">{session.user.name}</p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium group"
          >
            <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-500" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Content จะถูก Render ตรงนี้ตามหน้าที่เลือก */}
        {children}
      </main>
      
    </div>
  );
}
