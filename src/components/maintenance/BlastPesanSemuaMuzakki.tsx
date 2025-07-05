'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  onBack: () => void;
}

const BlastPesanSemuaMuzakki: React.FC<Props> = ({ onBack }) => {
  const [message, setMessage] = useState('Assalamu’alaikum {nama}, Alhamdulillah, terima kasih');
  const [poster, setPoster] = useState<File | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPoster(e.target.files[0]);
    }
  };

  const handleSend = () => {
    if (!message.trim()) {
      alert('Pesan tidak boleh kosong');
      return;
    }

    console.log('Poster:', poster);
    console.log('Pesan:', message);
    setIsSent(true);
    alert('Pesan berhasil dikirim ke seluruh muzakki!');
  };

  return (
    <div className="space-y-4 p-6">
      <Button variant="ghost" onClick={onBack}>← Kembali</Button>
      <h2 className="text-xl font-semibold">Blast Pesan ke Seluruh Muzakki</h2>

      <div className="border rounded-xl p-6 space-y-6 bg-white">
        {/* Upload Poster */}
        <div className="flex justify-center">
          <div
            className="w-[160px] h-[160px] bg-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition"
            onClick={() => document.getElementById('poster-upload')?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-4 4m4-4l4 4" />
            </svg>
            <p className="text-sm text-gray-600 text-center">
              {poster ? poster.name : 'Upload Poster'}
            </p>
          </div>
          <input
            id="poster-upload"
            type="file"
            className="hidden"
            onChange={handlePosterChange}
            accept="image/*"
          />
        </div>

        {/* Kolom Pesan */}
        <div>
          <textarea
            className="w-full border rounded-md p-4 min-h-[100px]"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSent}
          />
          <p className="text-xs text-gray-500 mt-2">{'{nama} akan diganti dengan nama muzakki'}</p>
        </div>

        {/* Info dan Tombol */}
        <div className="bg-gray-100 p-4 rounded-md flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-medium">Total Penerima: 300 Muzakki</p>
            <p className="text-sm text-gray-600">Pesan akan dikirim ke nomor HP sesuai data muzakki</p>
          </div>

          {isSent ? (
            <button
              className="bg-gray-300 text-white px-4 py-2 rounded-md cursor-not-allowed"
              disabled
            >
              Terkirim
            </button>
          ) : (
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSend}
            >
              ✓ Kirim Pesan Sekarang
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlastPesanSemuaMuzakki;
