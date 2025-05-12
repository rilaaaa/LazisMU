import React, { useState, useEffect } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { JournalTableProps } from '@/lib/types';
import { deleteJurnal, getJurnalDataById } from '@/api/database';
import { Skeleton } from "@/components/ui/skeleton";

export default function JournalTable({ onDeleteSuccess, setSelectedJournal, entries }: JournalTableProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [entries]);

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    const success = await deleteJurnal(id);
    if (success) {
      onDeleteSuccess();
    } else {
      console.error(`Failed to delete jurnal with id ${id}`);
    }
    setIsLoading(false);
  };

  const handleRowClick = async (id: number) => {
    setIsLoading(true);
    const journal = await getJurnalDataById(id);
    setSelectedJournal(journal);
    setIsLoading(false);
  };

  // 🔍 Step 1: Filter jurnal umum dan entri dengan no_hp terisi
  const filteredUmum = entries.filter(entry => 
    entry.jenisJurnal?.toLowerCase() === 'umum' && entry.no_hp?.trim() !== ''
  );

  // 🧹 Step 2: Normalisasi nomor HP (hapus tanda strip) dan ambil entri unik berdasarkan nomor
  const uniqueByPhone: { [key: string]: any } = {};
  filteredUmum.forEach(entry => {
    const cleanPhone = entry.no_hp.replace(/-/g, '').trim(); // Hapus strip pada nomor HP
    if (cleanPhone) {
      // Jika sudah ada entri dengan nomor HP yang sama, gabungkan informasi
      if (uniqueByPhone[cleanPhone]) {
        const existingEntry = uniqueByPhone[cleanPhone];

        // Gabungkan data jika ada perbedaan antara entri yang sama (misalnya nama, jenisJurnal)
        existingEntry.name = existingEntry.name || entry.name;
        existingEntry.jenisJurnal = existingEntry.jenisJurnal || entry.jenisJurnal;
        // Gabungkan data lain sesuai kebutuhan, misalnya alamat atau status
        // existingEntry.alamat = existingEntry.alamat || entry.alamat;

      } else {
        // Jika belum ada entri untuk nomor HP tersebut, masukkan entri pertama
        uniqueByPhone[cleanPhone] = { ...entry, no_hp: cleanPhone };
      }
    }
  });

  // Ambil nilai-nilai dari objek uniqueByPhone (setelah digabungkan)
  const cleanedEntries = Object.values(uniqueByPhone);

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nama Jurnal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Jenis Jurnal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-6 py-4 whitespace-nowrap"><Skeleton className="h-8 w-20" /></td>
                </tr>
              ))
            ) : (
              cleanedEntries.map((entry, index) => (
                <tr key={entry.id} onClick={() => handleRowClick(entry.id)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.jenisJurnal}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id);
                        }}
                        className="text-orange-600 hover:text-orange-900 flex items-center space-x-2 rounded-sm outline outline-gray-200 outline-1 outline-offset-4"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-5 w-5" />
                        <span style={{ color: 'black' }}>Hapus</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/api/download?id=${entry.id}`;
                        }}
                        className="text-orange-600 hover:text-blue-900 flex items-center space-x-2 rounded-sm outline outline-gray-200 outline-1 outline-offset-4"
                      >
                        <Download className="h-5 w-5" />
                        <span style={{ color: 'black' }}>Unduh</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
