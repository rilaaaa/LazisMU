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

export default function MaintenancePage() {
  const [showBlastPage, setShowBlastPage] = useState(false);
  const [showKategoriSelection, setShowKategoriSelection] = useState(false);
  const [showBlastPerKategoriPage, setShowBlastPerKategoriPage] = useState(false);
  const [selectedKategori, setSelectedKategori] = useState<string | null>(null);
  const [showReminderPage, setShowReminderPage] = useState(false);

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
  };

  return (
    <main className="p-6"> 
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
            <Button
              onClick={() => {
                console.log('Button Momentum diklik');
                handleKategoriSelect('momentum');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto"
            >
              Momentum
            </Button>
            <Button
              onClick={() => handleKategoriSelect('besar-sering')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto"
            >
              Besar Sering
            </Button>
            <Button
              onClick={() => handleKategoriSelect('besar-jarang')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto"
            >
              Besar Jarang
            </Button>
            <Button
              onClick={() => handleKategoriSelect('kecil-sering')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto"
            >
              Kecil Sering
            </Button>
            <Button
              onClick={() => handleKategoriSelect('kecil-jarang')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto"
            >
              Kecil Jarang
            </Button>
            <Button
              onClick={() => handleKategoriSelect('calon')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-4 h-auto"
            >
              Calon
            </Button>
          </div>
        </div>
      ) : showReminderPage ? (
        <ReminderTelatDonasi onBack={() => setShowReminderPage(false)} />
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold">Maintenance Muzakki</h1>
            <div className="relative">
              <Bell className="text-gray-400" />
              <span className="absolute -top-2 -right-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">9</span>
            </div>
          </div>

          {/* Informational Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border p-4 rounded-xl shadow">
              <h2 className="font-semibold mb-1">Pesan Massal</h2>
              <p className="text-sm text-gray-500 mb-3">Kirim pesan edukasi/informasi ke semua muzakki</p>
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

            <div className="border p-4 rounded-xl shadow">
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

          {/* Table Muzakki */}
          <div className="overflow-auto rounded-xl border">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3"><Checkbox /></th>
                  <th className="p-3">Nama</th>
                  <th className="p-3">No. HP</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3"><Checkbox /></td>
                  <td className="p-3">Ahmad Fajar</td>
                  <td className="p-3">081234567890</td>
                  <td className="p-3 text-green-600 font-medium">Aktif</td>
                  <td className="p-3">
                    <Button size="sm" className="bg-orange-500 text-white hover:bg-orange-600">Kirim</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}