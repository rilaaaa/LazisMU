// File: D:\Semester_6\kepin\new\LazisMU-maintenance_lintang\LazisMU-maintenance_lintang\src\components\dashboard\Chart.tsx

"use client";

import React, { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Muzakki } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

// Helper untuk format mata uang
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

interface ChartSectionProps {
  data: Muzakki[];
}

const ChartSection: React.FC<ChartSectionProps> = ({ data }) => {
  const aggregatedData = useMemo(() => {
    // ---- LOGIKA FINAL: Menghitung 4 kategori secara terpisah ----
    const totals = data.reduce((acc, item) => {
      const nominal = item.nominal ?? 0;
      const sumberLower = item.source?.toLowerCase() ?? '';

      if (sumberLower.includes('zakat')) {
        acc.zakat += nominal;
      } 
      else if (sumberLower.includes('infaq') || sumberLower.includes('sedekah') || sumberLower.includes('donasi')) {
        // 'donasi' dimasukkan ke infaq agar "Donasi Palestina" tidak masuk ke DSKL
        acc.infaq += nominal;
      } 
      else if (sumberLower.includes('csr')) {
        acc.csr += nominal;
      } 
      else {
        // Semua sisanya yang tidak cocok, masuk ke DSKL
        acc.dskl += nominal;
      }
      return acc;
    }, { 
      zakat: 0, 
      infaq: 0, 
      csr: 0,
      dskl: 0 
    });
    
    // grandTotal menjumlahkan semua kategori
    const grandTotal = totals.zakat + totals.infaq + totals.csr + totals.dskl;
    return { ...totals, grandTotal };
  }, [data]);

  const penghimpunanDoughnutData = {
    labels: ['Zakat', 'Infaq', 'CSR', 'DSKL'],
    datasets: [{
      label: 'Total Penghimpunan',
      data: [
        aggregatedData.zakat,
        aggregatedData.infaq,
        aggregatedData.csr,
        aggregatedData.dskl,
      ],
      backgroundColor: [
        '#66BB6A', // Zakat (Hijau)
        '#EF5350', // Infaq (Merah)
        '#2196F3', // CSR (Biru)
        '#FFC107', // DSKL (Oranye/Kuning)
      ],
      borderColor: '#FFFFFF',
      borderWidth: 4,
      cutout: '70%',
    }],
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-700 mb-4">Penghimpunan</h2>
      <div className="flex-grow flex flex-col md:flex-row items-center gap-6">
        
        <div className="relative w-full md:w-2/5 h-48 md:h-full">
          <Doughnut
            data={penghimpunanDoughnutData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context: any) => context.raw ? `${context.label}: ${formatCurrency(context.raw)}` : '',
                  },
                },
              },
            }}
          />
        </div>

        {/* Tampilan rincian teks menampilkan 4 kategori */}
        <div className="w-full md:w-3/5 flex flex-col justify-center">
          <div className="space-y-3">
            <div className="flex justify-between font-semibold"><span className="text-gray-600">Zakat</span><span>{formatCurrency(aggregatedData.zakat)}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-gray-600">Infaq</span><span>{formatCurrency(aggregatedData.infaq)}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-gray-600">CSR</span><span>{formatCurrency(aggregatedData.csr)}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-gray-600">DSKL</span><span>{formatCurrency(aggregatedData.dskl)}</span></div>
          </div>
        </div>

      </div>
       <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-gray-100">
        <span className="text-lg font-bold text-gray-800">Total Penghimpunan :</span>
        <span className="text-lg font-bold text-gray-800">{formatCurrency(aggregatedData.grandTotal)}</span>
      </div>
    </div>
  );
};

export default ChartSection;