import React, { useEffect, useState } from 'react';

interface JournalEntry {
  id: string;
  tanggal: string;
  akun: string;
  debit: number;
  kredit: number;
}

const JournalTable: React.FC = () => {
  // Data asli (tetap dipertahankan untuk keperluan lain)
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  // Data hasil cleaning (untuk ditampilkan)
  const [cleanedEntries, setCleanedEntries] = useState<JournalEntry[]>([]);

  // Simulasi fetch data dari dua sumber berbeda
  useEffect(() => {
    // Fetch data asli dari 'jurnal umum'
    fetch('/api/JurnalData')
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
      });

    // Fetch data hasil cleaning
    fetch('/api/JurnalDataCleanings')
      .then((res) => res.json())
      .then((cleanData) => {
        setCleanedEntries(cleanData);
      });
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Tabel Jurnal (Data Cleaning)</h2>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Tanggal</th>
            <th className="border px-4 py-2">Akun</th>
            <th className="border px-4 py-2">Debit</th>
            <th className="border px-4 py-2">Kredit</th>
          </tr>
        </thead>
        <tbody>
          {cleanedEntries.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-4">
                Tidak ada data yang ditampilkan.
              </td>
            </tr>
          ) : (
            cleanedEntries.map((entry, index) => (
              <tr key={entry.id || index}>
                <td className="border px-4 py-2">{entry.tanggal}</td>
                <td className="border px-4 py-2">{entry.akun}</td>
                <td className="border px-4 py-2">{entry.debit}</td>
                <td className="border px-4 py-2">{entry.kredit}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default JournalTable;
