'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell } from 'lucide-react';

import BlastPesanSemuaMuzakki from '@/components/maintenance/BlastPesanSemuaMuzakki';
import BlastPesanPerKategori from '@/components/maintenance/BlastPesanPerKategori';
import ReminderTelatDonasi from '@/components/maintenance/ReminderTelatDonasi';
import BlastPesanManual from '@/components/maintenance/BlastPesanManual';

export default function MaintenancePage() {
  const [showBlastPage, setShowBlastPage] = useState(false);
  const [showKategoriSelection, setShowKategoriSelection] = useState(false);
  const [showBlastPerKategoriPage, setShowBlastPerKategoriPage] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState<string | null>(null);
  const [showReminderPage, setShowReminderPage] = useState(false);
  const [search, setSearch] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
  const [selectedMuzakki, setSelectedMuzakki] = useState<any | null>(null);

  const data = [
    { id: '1', name: 'Ahmad Fajar', phone: '081234567890', status: 'Terkirim' },
    { id: '2', name: 'Siti Nurhaliza', phone: '081222223333', status: 'Terkirim' },
  ];

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search)
  );

  const handleSelectAll = () => {
    const newSelected = !selectAll;
    setSelectAll(newSelected);
    const updatedItems: { [key: string]: boolean } = {};
    filteredData.forEach((item) => {
      updatedItems[item.id] = newSelected;
    });
    setSelectedItems(updatedItems);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleKategoriClick = () => {
    setShowKategoriSelection(true);
  };

  const handleKategoriSelect = (kategori: string) => {
    console.log('Kategori dipilih:', kategori);
    setSelectedKategori(kategori);
    setShowKategoriSelection(false);
    setShowBlastPerKategoriPage(true);
    console.log('State setelah pilih:', { kategori, showKategoriSelection: false, showBlastPerKategoriPage: true });
  };

  const handleBackFromKategoriSelection = () => {
    setShowKategoriSelection(false);
    setSelectedKategori(null);
  };

  const handleBackFromBlastPerKategori = () => {
    setShowBlastPerKategoriPage(false);
    setSelectedKategori(null);
    setShowKategoriSelection(true);
  };

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      {showBlastPage ? (
        <BlastPesanSemuaMuzakki onBack={() => setShowBlastPage(false)} />
      ) : showBlastPerKategoriPage && selectedKategori ? (
        <BlastPesanPerKategori
          kategori={selectedKategori}
          onBack={handleBackFromBlastPerKategori}
        />
      ) : showKategoriSelection ? (
        <div>
          <Button
            onClick={handleBackFromKategoriSelection}
            className="mb-4 bg-gray-300 text-black hover:bg-gray-400"
          >
            ← Kembali
          </Button>
          <h2 className="text-xl font-bold mb-4">Pilih Kategori Muzakki</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['momentum', 'besar-sering', 'besar-jarang', 'kecil-sering', 'kecil-jarang', 'calon'].map((kategori) => (
              <Button
                key={kategori}
                onClick={() => handleKategoriSelect(kategori)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto capitalize"
              >
                {kategori.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>
      ) : showReminderPage ? (
        <ReminderTelatDonasi onBack={() => setShowReminderPage(false)} />
      ) : (
        <>

          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Maintenance Muzakki</h1>
            <div className="flex items-center px-3 py-1.5 rounded-full shadow bg-[#f9f9f9] border border-gray-200 gap-2">
              <Bell className="w-5 h-5" strokeWidth={1.8} color="#6B7280" />
              <span className="text-gray-600 text-sm font-medium">Notifikasi</span>
              <div className="w-6 h-6 rounded-full bg-gray-200 shadow-inner border border-gray-300 flex items-center justify-center">
                <span className="text-gray-700 text-sm font-semibold">9</span>
                </div>
                </div>
                </div>

          {/* Cards */}
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
                  onClick={handleKategoriClick}
                >
                  Kirim per Kategori
                </Button>
              </div>
            </div>

            <div className="border p-4 rounded-xl shadow bg-white">
              <h2 className="font-semibold mb-1">Muzakki Telat Donasi</h2>
              <div className="text-3xl font-bold text-orange-500 mb-2">12</div>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setShowReminderPage(true)}
              >
                Kirim Reminder
              </Button>
            </div>
          </div>

          {/* Search Bar */}
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-xl border shadow bg-white">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-4 border-r text-left">
                    <Checkbox checked={Boolean(selectAll)} onCheckedChange={handleSelectAll} />
                  </th>
                  <th className="p-4 border-r text-left">Nama</th>
                  <th className="p-4 border-r text-left">No. HP</th>
                  <th className="p-4 border-r text-left">Status</th>
                  <th className="p-4 text-left">Kirim Manual</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 border-r">
                      <Checkbox
                        checked={Boolean(selectedItems[item.id])}
                        onCheckedChange={() => handleSelectItem(item.id)}
                      />
                    </td>
                    <td className="p-4 border-r font-medium text-gray-800">{item.name}</td>
                    <td className="p-4 border-r">{item.phone}</td>
                    <td className="p-4 border-r text-green-600 font-medium">{item.status}</td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        className="bg-orange-500 text-white hover:bg-orange-600 rounded-md px-4"
                        onClick={() => setSelectedMuzakki(item)}
                      >
                        Kirim
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Popup Kirim Manual */}
      {selectedMuzakki && (
        <BlastPesanManual
          muzakki={selectedMuzakki}
          onClose={() => setSelectedMuzakki(null)}
        />
      )}
    </main>
  );
}
