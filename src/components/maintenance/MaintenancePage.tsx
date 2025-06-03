import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Maintenance Muzakki</h1>
        <div className="relative">
          <Bell className="text-gray-400" />
          <span className="absolute -top-2 -right-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">9</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-1">Pesan Massal</h2>
          <p className="text-sm text-gray-500 mb-3">Kirim pesan edukasi/informasi ke semua muzakki</p>
          <div className="flex gap-2">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">Kirim ke Semua Muzakki</Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">Kirim per Kategori</Button>
          </div>
        </div>
        <div className="border p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-1">Muzakki Telat Donasi</h2>
          <div className="text-3xl font-bold text-orange-500 mb-2">12</div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">Kirim Reminder ke Semua</Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="momentum">
          <TabsList>
            <TabsTrigger value="momentum">Momentum</TabsTrigger>
            <TabsTrigger value="besar-sering">Besar Sering</TabsTrigger>
            <TabsTrigger value="besar-jarang">Besar Jarang</TabsTrigger>
            <TabsTrigger value="kecil-sering">Kecil Sering</TabsTrigger>
            <TabsTrigger value="kecil-jarang">Kecil Jarang</TabsTrigger>
            <TabsTrigger value="calon">Calon</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input placeholder="Cari" className="w-64 border-orange-400" />
      </div>

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3"><Checkbox /></th>
              <th className="p-3">Nama Muzakki</th>
              <th className="p-3">Nomor HP</th>
              <th className="p-3">Status</th>
              <th className="p-3">Kirim Manual</th>
            </tr>
          </thead>
          <tbody>
            {/* Data dummy, nanti kamu bisa sambungkan ke API */}
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
    </main>
  );
}
