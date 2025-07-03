// D:\Semester_6\kepin\new\LazisMU-maintenance_lintang\LazisMU-maintenance_lintang\src\components\dashboard\PenyaluranCharts.tsx

'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// PERBAIKAN: Hapus import dan register plugin yang menyebabkan error
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper untuk format mata uang
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(value);
};

// Tipe data
interface PenyaluranDashboardData {
    [sumberDana: string]: {
        total: number;
        detail: { name: string; value: number }[];
    };
}

// --- Komponen untuk satu kartu grafik ---
const PenyaluranChart = ({ title, data, total }: { title: string, data: { name: string, value: number }[], total: number }) => {
    const chartData = {
        labels: data.map(d => d.name),
        datasets: [{
            label: 'Nominal',
            data: data.map(d => d.value),
            backgroundColor: 'rgba(251, 146, 60, 0.7)', // Warna oranye
            borderColor: 'rgba(234, 88, 12, 1)',
            borderWidth: 1,
        }],
    };

    const options = {
        // Opsi untuk membuat grafik vertikal
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context: any) => context.raw ? `${context.label}: ${formatCurrency(context.raw)}` : '',
                }
            },
        },
        scales: {
            y: { // Sumbu Y (vertikal) untuk nilai nominal
                beginAtZero: true,
                ticks: {
                    // Format label sumbu Y menjadi 'Rb' (Ribu)
                    callback: function(value: any) {
                        if (Number(value) >= 1000) {
                            return (Number(value) / 1000) + ' Rb';
                        }
                        return `Rp ${value}`;
                    }
                }
            }
        },
    };

    return (
        <div className="p-4 bg-white shadow rounded h-80 flex flex-col">
            <div className="flex justify-between font-bold mb-2">
                <h3 className="text-lg">{title}</h3>
                <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex-grow relative">
                {data.length > 0 ? (
                    <Bar options={options} data={chartData} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Tidak ada data
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Komponen Kontainer Utama ---
export default function GrafikPenyaluranContainer() {
    const [penyaluranData, setPenyaluranData] = useState<PenyaluranDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/grafik-penyaluran');
                const result = await response.json();

                if (result.status === 'success') {
                    setPenyaluranData(result.data);
                }
            } catch (error) {
                console.error("Error fetching penyaluran data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);
    
    if (isLoading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="bg-white p-4 rounded-lg shadow-md h-80 animate-pulse"></div>)}
            </div>
        );
    }

    const chartSources = ['Zakat', 'Infaq', 'CSR', 'DSKL'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chartSources.map(source => {
                const chartData = penyaluranData?.[source];
                const dataForChart = chartData ? chartData.detail : [];
                const totalForChart = chartData ? chartData.total : 0;
                
                return (
                    <PenyaluranChart 
                        key={source}
                        title={source}
                        data={dataForChart}
                        total={totalForChart}
                    />
                );
            })}
        </div>
    );
}