'use client';

import React, { useState, useMemo, ChangeEvent } from 'react';
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
  const {
    searchTerm, setSearchTerm, isModalOpen, setIsModalOpen,
    selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
    journalEntries, clearFilters, fetchJournalEntries, filteredEntries
  } = useJournalEntries();

  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [isLoading] = useState(false);

  const ENTRIES_PER_PAGE = 6;
  const DETAIL_ENTRIES_PER_PAGE = 10;

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    selectedJournal ? setDetailSearchTerm(value) : setSearchTerm(value);
  };

  const clearSearch = () => {
    selectedJournal ? setDetailSearchTerm('') : setSearchTerm('');
  };

  const handleFilterChange = (type: 'year' | 'month', value: string) => {
    if (type === 'year') {
      setSelectedYear(value ? parseInt(value) : null);
    } else {
      setSelectedMonth(value ? parseInt(value) : null);
    }
  };

  const filteredDetailEntries = useMemo(() => {
    if (!selectedJournal) return [];
    const term = detailSearchTerm.toLowerCase();
    return selectedJournal.JurnalData.filter(item =>
      item.nama.toLowerCase().includes(term) ||
      (item.no_hp || '').toLowerCase().includes(term) ||
      (item.zis || '').toLowerCase().includes(term) ||
      (item.via || '').toLowerCase().includes(term) ||
      item.tahun.toString().includes(term) ||
      (item.jenis_donatur || '').toLowerCase().includes(term)

    );
  }, [selectedJournal, detailSearchTerm]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ENTRIES_PER_PAGE;
    return filteredEntries.slice(start, start + ENTRIES_PER_PAGE);
  }, [filteredEntries, currentPage]);

  const paginatedDetailEntries = useMemo(() => {
    const start = (detailCurrentPage - 1) * DETAIL_ENTRIES_PER_PAGE;
    return filteredDetailEntries.slice(start, start + DETAIL_ENTRIES_PER_PAGE);
  }, [filteredDetailEntries, detailCurrentPage]);

  const yearOptions = useMemo(() => getUniqueYears(journalEntries), [journalEntries]);

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Jurnal Khusus</h1>
        <Notifications />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
        <div className="flex flex-wrap items-center space-x-4">
          <YearFilter
            selectedYear={selectedYear}
            handleYearChange={e => handleFilterChange('year', e.target.value)}
            yearOptions={yearOptions}
            disabled={!!selectedJournal}
          />
          <MonthFilter
            selectedMonth={selectedMonth}
            handleMonthChange={e => handleFilterChange('month', e.target.value)}
            disabled={!!selectedJournal}
          />
          {selectedJournal && (
            <button onClick={() => setSelectedJournal(null)} className="btn-gray">
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back
            </button>
          )}
          {(selectedYear || selectedMonth) && (
            <button onClick={clearFilters} className="btn-gray">
              <XCircleIcon className="h-5 w-5 mr-1" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center w-full sm:w-auto">
          <SearchBar
            searchTerm={selectedJournal ? detailSearchTerm : searchTerm}
            onSearchChange={handleSearchChange}
            onClearSearch={clearSearch}
          />
          <button onClick={() => setIsModalOpen(true)} className="ml-4 bg-orange-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-orange-600">
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

      <Pagination
        currentPage={selectedJournal ? detailCurrentPage : currentPage}
        totalPages={selectedJournal
          ? Math.ceil(filteredDetailEntries.length / DETAIL_ENTRIES_PER_PAGE)
          : Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE)}
        onPageChange={selectedJournal ? setDetailCurrentPage : setCurrentPage}
        totalItems={selectedJournal ? filteredDetailEntries.length : filteredEntries.length}
      />

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
