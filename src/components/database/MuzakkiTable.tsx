import React from 'react'
import { Muzakki } from '@/lib/types'

type MuzakkiTableProps = {
  muzakkiData: Muzakki[],
  currentPage: number,
}

export default function MuzakkiTable({ muzakkiData, currentPage }: MuzakkiTableProps) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Muzakki</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor HP</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Kelamin</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Umur</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pekerjaan</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Donasi</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Donatur</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahun</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {muzakkiData.map((muzakki, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(currentPage - 1) * 7 + index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{muzakki.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muzakki.phoneNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muzakki.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muzakki.age}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muzakki.occupation}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muzakki.donationType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muzakki.donorType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muzakki.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}