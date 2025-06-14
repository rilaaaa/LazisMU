'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X } from 'lucide-react';

interface Props {
  muzakki: { id: number; nama: string };
  onClose: () => void;
}

export default function BlastPesanManual({ muzakki, onClose }: Props) {
  const [poster, setPoster] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pesan, setPesan] = useState('');

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPoster(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePoster = () => {
    setPoster(null);
    setPreviewUrl(null);
  };

  const handleSend = () => {
    console.log('Mengirim ke', muzakki.nama, pesan, poster);
    onClose();
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[90%] md:w-[700px] shadow-xl space-y-4 relative">
        {/* Tombol X Tutup */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
        >
          <X />
        </button>

        <h2 className="text-xl font-semibold">
          Kirim Pesan <span className="text-orange-600">{muzakki.nama}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview Poster */}
          {previewUrl ? (
            <div className="relative border rounded-xl overflow-hidden bg-gray-50 p-1 h-60 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="object-cover h-full rounded-md"
              />
              <button
                onClick={handleRemovePoster}
                className="absolute top-2 right-2 bg-white rounded-full shadow p-1 hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            // Upload Area
            <label
              htmlFor="poster"
              className="border-2 border-dashed border-gray-300 flex flex-col items-center justify-center rounded-xl h-60 cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <Upload className="w-6 h-6 text-gray-500 mb-1" />
              <span className="text-gray-500">Upload Poster</span>
              <input
                id="poster"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePosterChange}
              />
            </label>
          )}

          {/* Textarea Pesan */}
          <Textarea
            placeholder="Tulis pesan di sini..."
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            className="w-full h-full min-h-[240px]"
          />
        </div>

        {/* Tombol Kirim */}
        <div className="text-right">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSend}
          >
            Kirim Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
