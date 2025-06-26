'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface Muzakki {
  id: number;
  nama: string;
  no_hp: string;
}

interface Props {
  onBack: () => void;
  totalMuzakki: number; // masih dipakai, walau jumlah real dari API
}

const BlastPesanSemuaMuzakki: React.FC<Props> = ({ onBack, totalMuzakki }) => {
  const [message, setMessage] = useState('Assalamu’alaikum {nama}, Alhamdulillah, terima kasih');
  const [poster, setPoster] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);

  useEffect(() => {
  const fetchMuzakki = async () => {
    try {
      const res = await fetch('/api/muzzaki'); // <== sudah benar URL-nya
      const json = await res.json();

      if (Array.isArray(json.data)) {
        const cleaned = json.data.map((item: any) => ({
          id: item.id,
          nama: item.name,
          no_hp: item.phoneNumber,
        }));

        setMuzakkiList(cleaned);
      } else {
        console.error('Data muzakki tidak valid:', json);
      }
    } catch (error) {
      console.error('Gagal mengambil data muzakki:', error);
    }
  };

  fetchMuzakki();
}, []);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPoster(file);
      setPosterPreview(URL.createObjectURL(file));
    } else {
      alert('Mohon upload file gambar (.jpg, .png, dll)');
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

  if (muzakkiList.length === 0) {
    alert('Data muzakki kosong.');
    return;
  }

  const recipients = muzakkiList.map((m) => ({
    name: m.nama,
    no: m.no_hp.startsWith('62') ? m.no_hp : `62${m.no_hp.replace(/^0+/, '')}`,
  }));

  const payload = {
    recipients,
    template: message,
  };

  console.log('Payload yang akan dikirim (simulasi):', payload); // ✅ INI YANG MENAMPILKAN KE CONSOLE LOG

  alert(`Simulasi pengiriman berhasil ke ${recipients.length} muzakki. Lihat console log.`);
  setIsSent(true);
};


  return (
    <div className="p-6 space-y-6">
      <Button
        onClick={onBack}
        className="bg-gray-200 text-black hover:bg-gray-300 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-base font-normal">Kembali</span>
      </Button>

      <h2 className="text-xl font-bold">Blast Pesan ke Seluruh Muzakki</h2>

      <div className="flex flex-col md:flex-row gap-6 border-2 border-gray-200 p-6 rounded-xl bg-white">
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

        <div className="flex-1 border rounded-lg p-4">
          <Textarea
            placeholder="Tulis pesan di sini..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSent}
            className="h-40"
          />
          <p className="text-xs text-gray-500 mt-2">{'{nama} akan diganti dengan nama muzakki'}</p>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-medium">
            Total Penerima: {muzakkiList.length} Muzakki
          </p>
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
