'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface DonationRecord {
  Id: number;
  SenderName: string;
  Message: string;
  Amount: number;
  PaymentRef: string;
  CreatedAt: string;
}

const columnHelper = createColumnHelper<DonationRecord>();

const columns = [
  columnHelper.accessor('CreatedAt', {
    header: 'วันที่ / เวลา',
    cell: info => new Date(info.getValue()).toLocaleString('th-TH'),
  }),
  columnHelper.accessor('SenderName', {
    header: 'ชื่อผู้บริจาค',
    cell: info => <span className="font-bold">{info.getValue()}</span>,
  }),
  columnHelper.accessor('Message', {
    header: 'ข้อความ',
    cell: info => <span className="text-gray-600">{info.getValue() || '-'}</span>,
  }),
  columnHelper.accessor('Amount', {
    header: 'จำนวนเงิน (บาท)',
    cell: info => <span className="text-green-600 font-bold">{info.getValue().toLocaleString()} ฿</span>,
  }),
  columnHelper.accessor('PaymentRef', {
    header: 'เลขอ้างอิง',
    cell: info => <span className="text-xs text-gray-400 font-mono">{info.getValue()}</span>,
  }),
];

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const streamerId = session?.user?.name || session?.user?.id; 

  const [data, setData] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const API_URL = process.env.NEXT_PUBLIC_DONATION_API_URL || 'http://localhost:3001';

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    const fetchHistory = async () => {
      if (status !== 'authenticated' || !streamerId) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/donations/history/${streamerId}?page=${page}&limit=${limit}`);
        const result = await res.json();
        
        if (res.ok) {
          setData(result.data || []);
          if (result.meta) {
            setTotalPages(result.meta.totalPages || 1);
          }
        } else {
          setError(result.error || 'ไม่สามารถดึงข้อมูลประวัติได้');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, API_URL, streamerId, status]);

  if (status === 'loading') {
    return <div className="p-8 text-center">กำลังตรวจสอบสิทธิ์...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ประวัติการรับโดเนท</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p>กำลังโหลดข้อมูลประวัติ...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-20 text-red-500 bg-red-50/50">
            <AlertCircle className="w-10 h-10 mb-4" />
            <p>{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg">ยังไม่มีประวัติการรับโดเนทในขณะนี้</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className="p-4 text-sm font-bold text-gray-600 whitespace-nowrap">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="p-4 align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50/50">
                <span className="text-sm text-gray-500">
                  หน้า {page} จาก {totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
