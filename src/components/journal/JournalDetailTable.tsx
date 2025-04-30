import React from 'react';
import { JournalDetailTableProps, JurnalDataRow } from '@/lib/types';

export default function JournalDetailTable({ journal, entries }: JournalDetailTableProps & { searchTerm: string, entries: JurnalDataRow[] }) {
  if (!journal || !journal.JurnalData) {
    return null;
  }

  return (
    <div className='overflow-x-auto'>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nama</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">No HP</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">ZIS</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Via</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tahun</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Jenis Donatur</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((data, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.nama}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.no_hp}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.zis}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.via}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.tahun}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.jenis_donatur}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
