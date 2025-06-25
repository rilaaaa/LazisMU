'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BlastPesanSemuaMuzakki from '@/components/maintenance/BlastPesanSemuaMuzakki';
import BlastPesanPerKategori from '@/components/maintenance/BlastPesanPerKategori';
import ReminderTelatDonasi from '@/components/maintenance/ReminderTelatDonasi';
import Notifications from '@/components/common/Notifications';

interface Muzzaki {
  id: string;
  name: string;
  phoneNumber: string;
  transactions?: { date: string; amount: number }[];
}

export default function MaintenancePage() {
  const [muzakkiList, setMuzakkiList] = useState<Muzzaki[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [telatDonasiCount, setTelatDonasiCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [showBlastPage, setShowBlastPage] = useState(false);
  const [showBlastPerKategoriPage, setShowBlastPerKategoriPage] = useState(false);
  const [showReminderPage, setShowReminderPage] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchMuzakki = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/muzzaki');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        let muzakkiData: Muzzaki[] = [];
        if (Array.isArray(data)) {
          muzakkiData = data;
        } else if (Array.isArray(data.data)) {
          muzakkiData = data.data;
        } else if (data.data && typeof data.data === 'object') {
          muzakkiData = Object.values(data.data);
        } else {
          throw new Error('Format data tidak dikenali');
        }

        const validatedData = muzakkiData.map((item) => ({
          id: item.id || '',
          name: item.name || '',
          phoneNumber: item.phoneNumber || '',
          donorType: item.donorType || item.kategori || 'Calon',
          transactions: item.transactions || []
    }));


        setMuzakkiList(validatedData);
        fetchTelatDonasiCount(validatedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        setMuzakkiList([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTelatDonasiCount = (data: Muzzaki[]) => {
      const telat = data.filter((muzakki) => {
        const transactions = (muzakki.transactions || [])
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (transactions.length < 3) return false;

        const [first, second, third] = transactions;
        const firstDate = new Date(first.date);
        const secondDate = new Date(second.date);
        const thirdDate = new Date(third.date);

        const dayDiff1 = Math.abs(firstDate.getDate() - secondDate.getDate());
        const dayDiff2 = Math.abs(secondDate.getDate() - thirdDate.getDate());

        const isConsecutiveMonths =
          (firstDate.getMonth() - secondDate.getMonth() === 1 ||
            (firstDate.getMonth() === 0 && secondDate.getMonth() === 11)) &&
          (secondDate.getMonth() - thirdDate.getMonth() === 1 ||
            (secondDate.getMonth() === 0 && thirdDate.getMonth() === 11));

        const currentMonth = new Date().getMonth();
        const hasCurrentMonthDonation = transactions.some(
          (t) => new Date(t.date).getMonth() === currentMonth
        );

        return dayDiff1 <= 2 && dayDiff2 <= 2 && isConsecutiveMonths && !hasCurrentMonthDonation;
      });

      setTelatDonasiCount(telat.length);
    };

    fetchMuzakki();
  }, []);

  const filteredData = muzakkiList.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.phoneNumber?.includes(search)
  );

  const handleKirimManual = (item: Muzzaki) => {
    alert(`Kirim manual ke ${item.name} - ${item.phoneNumber}`);
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      {showBlastPage ? (
        <BlastPesanSemuaMuzakki
          onBack={() => setShowBlastPage(false)}
          totalMuzakki={muzakkiList.length}
        />
      ) : showBlastPerKategoriPage ? (
        <BlastPesanPerKategori
          kategori="Semua Kategori"
          onBack={() => setShowBlastPerKategoriPage(false)}
          muzakkiList={muzakkiList}
        />
      ) : showReminderPage ? (
        <ReminderTelatDonasi onBack={() => setShowReminderPage(false)} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Maintenance Muzakki</h1>
            <Notifications />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border p-4 rounded-xl shadow bg-white">
              <h2 className="font-semibold mb-1">Pesan Massal</h2>
              <p className="text-sm text-gray-500 mb-3">
                Kirim pesan edukasi/informasi ke semua muzakki
              </p>
              <div className="flex gap-2">
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setShowBlastPage(true)}
                >
                  Kirim ke Semua
                </Button>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setShowBlastPerKategoriPage(true)}
                >
                  Kirim per Kategori
                </Button>
              </div>
            </div>

            <div className="border p-4 rounded-xl shadow bg-white">
              <h2 className="font-semibold mb-1">Muzakki Telat Donasi</h2>
              <div className="text-3xl font-bold text-orange-500 mb-2">{telatDonasiCount}</div>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setShowReminderPage(true)}
              >
                Kirim Reminder
              </Button>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103 10.5a7.5 7.5 0 0013.15 6.15z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
              />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border shadow bg-white">
            {loading ? (
              <div className="p-6 text-center">Memuat data...</div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                Error: {error}
                <Button onClick={() => window.location.reload()} className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                  Coba Lagi
                </Button>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-6 text-center">
                {search ? 'Tidak ada hasil pencarian' : 'Tidak ada data muzakki'}
              </div>
            ) : (
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-4 border-r text-left">Nama</th>
                    <th className="p-4 border-r text-left">No. HP</th>
                    <th className="p-4 text-left">Kirim Manual</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="p-4 border-r font-medium text-gray-800">{item.name || '-'}</td>
                      <td className="p-4 border-r">{item.phoneNumber || '-'}</td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          onClick={() => handleKirimManual(item)}
                          className="bg-orange-500 text-white hover:bg-orange-600 rounded-md px-4"
                        >
                          Kirim
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </main>
  );
}