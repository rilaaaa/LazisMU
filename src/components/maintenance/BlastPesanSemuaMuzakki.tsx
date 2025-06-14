'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const BlastPesanSemuaMuzakki: React.FC<Props> = ({ onBack }) => {
  const [message, setMessage] = useState(
    'Assalamu’alaikum {nama}, Alhamdulillah, terima kasih'
  );
  const [poster, setPoster] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPoster(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelPoster = () => {
    setPoster(null);
    setPosterPreview(null);
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
    <div className="p-6 space-y-6">
      {/* Tombol Kembali */}
      <Button
        onClick={onBack}
        className="bg-gray-200 text-black hover:bg-gray-300 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-normal">Kembali</span>
      </Button>

      <h2 className="text-xl font-bold">Blast Pesan ke Seluruh Muzakki</h2>

      <div className="flex flex-col md:flex-row gap-6 border-2 border-gray-200 p-6 rounded-xl bg-white">
        {/* Upload Poster */}
        <div className="flex-1 border rounded-lg p-4 relative min-h-[200px] flex items-center justify-center">
          {posterPreview ? (
            <div className="relative">
              <img
                src={posterPreview}
                alt="Preview Poster"
                className="max-h-60 object-contain rounded"
              />
              <button
                type="button"
                onClick={handleCancelPoster}
                className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-100 z-10"
                aria-label="Hapus poster"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full text-gray-500 hover:text-gray-700 border-dashed border-2 border-gray-300 rounded-lg">
              <Upload className="w-8 h-8 mb-2" />
              <span>Upload Poster</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePosterChange}
              />
            </label>
          )}
        </div>

        {/* Textarea untuk pesan */}
        <div className="flex-1 border rounded-lg p-4">
          <Textarea
            placeholder="Tulis pesan di sini..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSent}
            className="h-40"
          />
          
        </div>
      </div>

      {/* Info & tombol kirim */}
      <div className="bg-gray-100 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-medium">Total Penerima: 300 Muzakki</p>
          <p className="text-sm text-gray-600">
            Pesan akan dikirim ke semua nomor HP muzakki
          </p>
        </div>
        <div>
          {isSent ? (
            <Button disabled className="bg-gray-300 cursor-not-allowed">
              ✓ Terkirim
            </Button>
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
