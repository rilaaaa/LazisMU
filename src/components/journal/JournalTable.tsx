import React, { useState, useEffect } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { JournalTableProps } from '@/lib/types';
import { deleteJurnal, getJurnalDataById } from '@/api/database';
import { Skeleton } from "@/components/ui/skeleton";

export default function JournalTable({ onDeleteSuccess, setSelectedJournal, entries }: JournalTableProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    // Simulate a delay for loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [entries]);

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    const success = await deleteJurnal(id);
    if (success) {
      // console.log(`Jurnal with id ${id} deleted successfully`);
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
    // console.log(`Selected journal with name: ${journal.name}`);
    setIsLoading(false);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">No</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nama Jurnal</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-8" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-8 w-20" />
                  </td>
                </tr>
              ))
            ) : (
              entries.map((entry, index) => (
                <tr key={index} onClick={() => handleRowClick(entry.id)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* Delete Butston */}
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

                      {/* Download Button */}
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
