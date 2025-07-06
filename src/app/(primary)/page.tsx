// File: D:\Semester_6\kepin\new\LazisMU-maintenance_lintang\LazisMU-maintenance_lintang\src\app\(primary)\page.tsx

"use client";

import React, { useEffect, useState, useMemo } from "react";
import Notifications from "@/components/common/Notifications";
import ChartSection from "@/components/dashboard/Chart";
import PenyaluranCharts from "@/components/dashboard/PenyaluranCharts";
import { getAllJurnalCleaning } from "@/api/database";
import { Muzakki } from "@/lib/types";

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("id-ID").format(num);
};

export default function DashboardPage() {
  const [processedMuzakkiData, setProcessedMuzakkiData] = useState<Muzakki[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcessCleaningData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cleaningEntries: any[] = await getAllJurnalCleaning();
        if (!cleaningEntries || cleaningEntries.length === 0) {
          setProcessedMuzakkiData([]);
          setIsLoading(false);
          return;
        }
        const allMuzakkiEntries: Muzakki[] = cleaningEntries.map((entry) => ({
          id: entry.id,
          name: entry.nama,
          nominal: parseFloat(entry.nominal) || 0,
          source: entry.sumber_dana,
          donorType: entry.jenis_donatur,
          year: entry.tahun,
          tanggal: new Date(entry.tanggal),
          phoneNumber: entry.no_hp || "",
          gender: "Unknown",
          age: 0,
          donationType: entry.zis || "Lainnya",
          category: "Unknown",
          status: "Active",
          is_repeat: entry.is_repeat === true, // ✅ Tambahkan ini
        }));
        setProcessedMuzakkiData(allMuzakkiEntries);
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : "Terjadi kesalahan";
        console.error("--- FATAL ERROR:", errorMessage);
        setError("Gagal mengambil data dari server.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndProcessCleaningData();
  }, []);

  // ---- PERBAIKAN LOGIKA UTAMA DI SINI ----
  const statCounts = useMemo(() => {
    const totalUnique = processedMuzakkiData.length;

    const newDonors = processedMuzakkiData.filter(
      (item) => item.is_repeat === false
    ).length;
    const repeatDonors = processedMuzakkiData.filter(
      (item) => item.is_repeat === true
    ).length;

    return {
      totalUnique,
      new: newDonors,
      repeat: repeatDonors,
    };
  }, [processedMuzakkiData]);

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-700">Dashboard</h1>
        <Notifications />
      </div>

      {isLoading && (
        <div className="text-center py-20 text-gray-500">
          Memuat data dashboard...
        </div>
      )}
      {!isLoading && error && (
        <div className="text-center py-20 text-red-500 bg-red-50 p-4 rounded-lg">
          <p className="font-bold">Terjadi Error</p>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <ChartSection data={processedMuzakkiData} />
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md space-y-3 flex flex-col justify-center">
              <div className="flex justify-between items-center bg-orange-400/80 rounded-lg shadow-sm text-sm">
                <div className="bg-white px-4 py-3 rounded-l-lg font-semibold text-gray-700 w-1/3">
                  Total Muzakki
                </div>
                <div className="text-white font-bold px-4 text-center flex-1">
                  {formatNumber(statCounts.totalUnique)} Orang
                </div>
              </div>
              <div className="flex justify-between items-center bg-orange-400/80 rounded-lg shadow-sm text-sm">
                <div className="bg-white px-4 py-3 rounded-l-lg font-semibold text-gray-700 w-1/3">
                  Muzakki Baru
                </div>
                <div className="text-white font-bold px-4 text-center flex-1">
                  {formatNumber(statCounts.new)} Orang
                </div>
              </div>
              <div className="flex justify-between items-center bg-orange-400/80 rounded-lg shadow-sm text-sm">
                <div className="bg-white px-4 py-3 rounded-l-lg font-semibold text-gray-700 w-1/3">
                  Repeat Order
                </div>
                <div className="text-white font-bold px-4 text-center flex-1">
                  {formatNumber(statCounts.repeat)} Orang
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-700">Penyaluran</h1>
          </div>
          <PenyaluranCharts />
        </>
      )}
    </main>
  );
}
