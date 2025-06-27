import React from 'react';
import { JournalDetailTableProps } from '@/lib/types';

export default function JournalDetailTable({ journal, searchTerm }: JournalDetailTableProps & { searchTerm: string }) {
  const entries = journal?.JurnalDataCleanings || [];

  if (!journal || !entries.length) {
    return <p className="text-gray-500 text-sm px-4">Data jurnal tidak tersedia.</p>;
  }

  const filteredEntries = entries.filter((entry) =>
    entry.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='overflow-x-auto mt-4'>
      <table className="min-w-full divide-y divide-gray-200 bg-white shadow rounded-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Tanggal</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Nama</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">No HP</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Via</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Kategori</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Nominal</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Keterangan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredEntries.map((data, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-700">{data.tanggal}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{data.nama}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{data.no_hp}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{data.via}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{data.kategori}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{data.nominal}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{data.sumber_dana}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
