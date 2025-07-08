'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

interface Muzakki {
  id: number;
  nama: string;
  no_hp: string;
}

interface Props {
  onBack: () => void;
  totalMuzakki: number;
}

const BlastPesanSemuaMuzakki: React.FC<Props> = ({ onBack, totalMuzakki }) => {
  const [message, setMessage] = useState(''); 
  const [isSent, setIsSent] = useState(false);
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);

  useEffect(() => {
    const fetchMuzakki = async () => {
      try {
        const res = await fetch('/api/muzzaki');
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

  const handleSend = async () => {
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

    console.log('Payload yang akan dikirim:', payload);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Gagal kirim:', error);
        alert('Gagal mengirim pesan. Cek konsol.');
        return;
      }

      const result = await res.json();
      console.log('Respon API:', result);
      alert(`Pesan berhasil dikirim ke ${recipients.length} muzakki`);
      setIsSent(true);
    } catch (err) {
      console.error('Kesalahan saat mengirim:', err);
      alert('Terjadi kesalahan saat mengirim pesan.');
    }
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

      <div className="border-2 border-gray-200 p-6 rounded-xl bg-white">
        <Textarea
          placeholder="Tulis pesan di sini, gunakan {{nama}} untuk personalisasi ...."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSent}
          className="h-40"
        />
        <p className="text-xs text-gray-500 mt-2">{'{nama} akan diganti dengan nama muzakki'}</p>
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
              Kirim Pesan Sekarang
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlastPesanSemuaMuzakki;