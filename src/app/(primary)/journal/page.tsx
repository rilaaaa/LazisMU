'use client';

import React, { useState, useMemo } from 'react';
import { PlusIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import SearchBar from '@/components/common/SearchBar';
import JournalTable from '@/components/journal/JournalTable';
import JournalDetailTable from '@/components/journal/JournalDetailTable';
import FileUploadModal from '@/components/common/FileUploadModal';
import Notifications from '@/components/common/Notifications';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import YearFilter from '@/components/common/YearFilter';
import MonthFilter from '@/components/common/MonthFilter';
import Pagination from '@/components/common/Pagination';
import { JournalEntry } from '@/lib/types';
import { getUniqueYears } from '@/lib/utils';

export default function JournalPage() {
  const { searchTerm, setSearchTerm, isModalOpen, setIsModalOpen,
          selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, journalEntries,
          clearFilters, fetchJournalEntries, filteredEntries
        } = useJournalEntries();

  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [detailSearchTerm, setDetailSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [detailCurrentPage, setDetailCurrentPage] = useState<number>(1);
  const [isLoading] = useState<boolean>(false); 
  const ITEMS_PER_PAGE = 6;
  const DETAIL_ITEMS_PER_PAGE = 10;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedJournal) {
      setDetailSearchTerm(e.target.value);
    } else {
      setSearchTerm(e.target.value);
    }
  };

  const clearSearch = () => {
    if (selectedJournal) {
      setDetailSearchTerm('');
    } else {
      setSearchTerm('');
    }
  };

  const handleFilterChange = (filterType: 'year' | 'month', value: string) => {
    if (filterType === 'year') {
      setSelectedYear(value === '' ? null : parseInt(value, 10));
    } else {
      setSelectedMonth(value === '' ? null : parseInt(value, 10));
    }
  };

  const filteredDetailEntries = useMemo(() => {
    if (!selectedJournal) return [];
    return selectedJournal.JurnalData.filter(data => 
      data.nama.toLowerCase().includes(detailSearchTerm.toLowerCase()) ||
      data.no_hp.toLowerCase().includes(detailSearchTerm.toLowerCase()) ||
      data.zis.toLowerCase().includes(detailSearchTerm.toLowerCase()) ||
      data.via.toLowerCase().includes(detailSearchTerm.toLowerCase()) ||
      data.tahun.toString().includes(detailSearchTerm.toLowerCase()) ||
      data.jenis_donatur.toLowerCase().includes(detailSearchTerm.toLowerCase())
    );
  }, [selectedJournal, detailSearchTerm]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredEntries.slice(start, end);
  }, [filteredEntries, currentPage]);

  const paginatedDetailEntries = useMemo(() => {
    const start = (detailCurrentPage - 1) * DETAIL_ITEMS_PER_PAGE;
    const end = start + DETAIL_ITEMS_PER_PAGE;
    return filteredDetailEntries.slice(start, end);
  }, [filteredDetailEntries, detailCurrentPage]);

  const totalPages = useMemo(() => Math.ceil(filteredEntries.length / ITEMS_PER_PAGE), [filteredEntries]);
  const totalDetailPages = useMemo(() => Math.ceil(filteredDetailEntries.length / DETAIL_ITEMS_PER_PAGE), [filteredDetailEntries]);

  const yearOptions = useMemo(() => getUniqueYears(journalEntries), [journalEntries]);

  return (
    <div className="p-6" style={{ color: 'black' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Jurnal Umum</h1>
        <Notifications />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
        <div className="flex flex-wrap items-center space-x-4">
          <YearFilter 
            selectedYear={selectedYear} 
            handleYearChange={(e) => handleFilterChange('year', e.target.value || '')} 
            yearOptions={yearOptions} 
            disabled={!!selectedJournal}
          />
          <MonthFilter 
            selectedMonth={selectedMonth} 
            handleMonthChange={(e) => handleFilterChange('month', e.target.value || '')} 
            disabled={!!selectedJournal}
          />
          
          {selectedJournal && (
            <button
              onClick={() => setSelectedJournal(null)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back
            </button>
          )}

          {(selectedYear !== null || selectedMonth !== null) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <XCircleIcon className="h-5 w-5 mr-1" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center w-full sm:w-auto">
          <SearchBar searchTerm={selectedJournal ? detailSearchTerm : searchTerm} onSearchChange={handleSearchChange} onClearSearch={clearSearch} />
          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-4 bg-orange-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          {selectedJournal ? (
            <JournalDetailTable journal={selectedJournal} entries={paginatedDetailEntries} searchTerm={searchTerm} />
          ) : (
            <JournalTable 
              entries={paginatedEntries} 
              currentPage={currentPage} 
              onDeleteSuccess={fetchJournalEntries} 
              selectedJournal={selectedJournal} 
              setSelectedJournal={setSelectedJournal} 
              searchTerm={searchTerm}
              filteredEntries={filteredEntries}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {selectedJournal ? (
        <Pagination 
          currentPage={detailCurrentPage} 
          totalPages={totalDetailPages} 
          onPageChange={setDetailCurrentPage} 
          totalItems={filteredDetailEntries.length}
        />
      ) : (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={filteredEntries.length}
        />
      )}

      {isModalOpen && (
        <FileUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUploadSuccess={fetchJournalEntries}
        />
      )}
    </div>
  );
}