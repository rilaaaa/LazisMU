"use client";

import React, { useEffect, useState } from "react";
import Notifications from "@/components/common/Notifications";
import ChartSection from "@/components/dashboard/Chart";
import { getMuzakki } from "@/api/database";
import { Muzakki } from "@/lib/types";
import YearFilter from "@/components/common/YearFilter";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const [muzakkiData, setMuzakkiData] = useState<Muzakki[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDonorType, setSelectedDonorType] = useState<string | null>(null);
  const [selectedDonationType, setSelectedDonationType] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  const fetchMuzakkiData = async () => {
    const data = await getMuzakki();
    setMuzakkiData(data);
  };

  useEffect(() => {
    fetchMuzakkiData();
  }, []);

  const totalMuzakki = muzakkiData.length;

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(Number(e.target.value));
  };

  const handleDonorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDonorType(e.target.value);
  };

  const handleDonationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDonationType(e.target.value);
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGender(e.target.value);
  };

  const filteredMuzakkiData = muzakkiData
    .filter((item) => (selectedYear ? item.year === selectedYear : true))
    .filter((item) => (selectedDonorType ? item.donorType === selectedDonorType : true))
    .filter((item) => (selectedDonationType ? item.donationType === selectedDonationType : true))
    .filter((item) => (selectedGender ? item.gender === selectedGender : true));

  const selectedFilters = {
    year: selectedYear,
    donorType: selectedDonorType,
    donationType: selectedDonationType,
    gender: selectedGender,
  };

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <Notifications />
      </div>

      {/*Filter Section*/}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
        <div className="flex flex-wrap items-center space-x-4">
          <YearFilter
            selectedYear={selectedYear}
            handleYearChange={handleYearChange}
            yearOptions={[...new Set(muzakkiData.map((item) => item.year.toString()))]}
          />

          {/*Donor Type Filter*/}
          <div className="relative">
            <select onChange={handleDonorTypeChange} value={selectedDonorType || ""}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Donor Types</option>
              {[...new Set(muzakkiData.map((item) => item.donorType))].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {/*Donation Type Filter*/}
          <div className="relative">
            <select onChange={handleDonationTypeChange} value={selectedDonationType || ""}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Donation Types</option>
              {[...new Set(muzakkiData.map((item) => item.donationType))].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {/* Gender Type Filter */}
          <div className="relative">
            <select onChange={handleGenderChange} value={selectedGender || ""}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Genders</option>
              {[...new Set(muzakkiData.map((item) => item.gender))].map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="max-w-64 overflow-hidden rounded-xl bg-white shadow-lg my-5">
        <div className="flex items-center justify-between">
          <div className="p-4">
            <h2 className="font-bold text-gray-900">Total Muzakki</h2>
          </div>
          <div className="bg-[#FF5722] p-4">
            <span className="font-bold text-white">{totalMuzakki}</span>
          </div>
        </div>
      </div>
      <ChartSection data={filteredMuzakkiData} selectedFilters={selectedFilters} />
    </main>
  );
}