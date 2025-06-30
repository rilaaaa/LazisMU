// File: src/components/dashboard/PenyaluranCharts.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getAllPenyaluran, PenyaluranData } from '@/api/database'; // Pastikan path ini benar

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper untuk format mata uang
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

// Opsi dasar untuk semua bar chart
const barChartOptions: any = { // Dibuat any untuk kemudahan
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => context.raw ? formatCurrency(context.raw) : '0',
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => {
          if (value >= 1000000) return `${value / 1000000} Jt`;
          if (value >= 1000) return `${value / 1000} Rb`;
          return value;
        },
      },
    },
  },
};

// Kategori penyaluran di sumbu X
const ASNAF_CATEGORIES = ['Kemanusiaan', 'Dakwah', 'Pendidikan', 'Ekonomi', 'Lingkungan', 'Kesehatan'];

// Tipe untuk data yang sudah diproses
type ProcessedPenyaluran = {
  [key: string]: {
    total: number;
    details: { [category: string]: number };
  };
};

// Komponen untuk satu kartu chart
const PenyaluranCard = ({ title, total, chartData }: { title: string; total: number; chartData: any }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-lg font-bold">{title}</CardTitle>
      <div className="font-semibold text-md">{formatCurrency(total)}</div>
    </CardHeader>
    <CardContent>
      <div className="h-[250px]">
        <Bar options={barChartOptions} data={chartData} />
      </div>
    </CardContent>
  </Card>
);

export default function PenyaluranCharts() {
  const [penyaluranData, setPenyaluranData] = useState<PenyaluranData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllPenyaluran();
        setPenyaluranData(data);
      } catch (error) {
        console.error("Gagal mengambil data penyaluran:", error);
        setError("Gagal memuat data penyaluran. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const processedData: ProcessedPenyaluran = useMemo(() => {
    const initialData: ProcessedPenyaluran = {
      Zakat: { total: 0, details: {} },
      Infaq: { total: 0, details: {} },
      CSR: { total: 0, details: {} },
      DSKL: { total: 0, details: {} },
    };

    return penyaluranData.reduce((acc, item) => {
      // --- PERBAIKAN UTAMA DI SINI ---
      const sumber = item.sumber_dana; // Menggunakan 'sumber_dana' bukan 'number'
      const kategoriAsnaf = item.jenis_penyaluran;
      
      // Pastikan sumber dana ada di dalam accumulator kita
      if (acc[sumber]) {
        acc[sumber].total += item.nominal;
        acc[sumber].details[kategoriAsnaf] = (acc[sumber].details[kategoriAsnaf] || 0) + item.nominal;
      }
      return acc;
    }, initialData);
  }, [penyaluranData]);
  
  const createChartData = (details: { [category: string]: number }) => {
    return {
      labels: ASNAF_CATEGORIES,
      datasets: [{
        label: 'Total Penyaluran',
        data: ASNAF_CATEGORIES.map(cat => details[cat] || 0),
        backgroundColor: '#fb923c', // Warna oranye agar serasi dengan dashboard
        borderColor: '#f97316',
        borderWidth: 1,
      }],
    };
  };

  if (isLoading) {
    return <div className="mt-8 text-center p-10 bg-gray-50 rounded-lg">Memuat Data Penyaluran...</div>;
  }
  
  if (error) {
     return <div className="mt-8 text-center p-10 bg-red-50 text-red-600 rounded-lg">{error}</div>;
  }
  
  // Menampilkan pesan jika tidak ada data
  if(penyaluranData.length === 0){
    return <div className="mt-8 text-center p-10 bg-gray-50 rounded-lg">Belum ada data penyaluran.</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">Grafik Penyaluran</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PenyaluranCard title="Zakat" total={processedData.Zakat.total} chartData={createChartData(processedData.Zakat.details)} />
        <PenyaluranCard title="Infaq" total={processedData.Infaq.total} chartData={createChartData(processedData.Infaq.details)} />
        <PenyaluranCard title="CSR" total={processedData.CSR.total} chartData={createChartData(processedData.CSR.details)} />
        <PenyaluranCard title="DSKL" total={processedData.DSKL.total} chartData={createChartData(processedData.DSKL.details)} />
      </div>
    </div>
  );
}