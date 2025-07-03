import { useState, useEffect, useCallback } from 'react'
import { getJurnal } from '@/api/database'
import { JournalEntry } from '@/lib/types'
import { useFilteredEntries } from '@/lib/utils'

export function useJournalEntries() {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null)

  const fetchJournalEntries = async () => {
    const entries = await getJurnal()
    setJournalEntries(entries)
  }

  useEffect(() => {
    fetchJournalEntries()
  }, [])

  const filteredEntries = useFilteredEntries(journalEntries, searchTerm, selectedYear, selectedMonth)

  const clearFilters = useCallback(() => {
    setSelectedYear(null)
    setSelectedMonth(null)
    setSearchTerm('')
    setCurrentPage(1)
  }, [])

  return {
    searchTerm, setSearchTerm,
    currentPage, setCurrentPage,
    isModalOpen, setIsModalOpen,
    selectedYear, setSelectedYear,
    selectedMonth, setSelectedMonth,
    journalEntries, filteredEntries,
    clearFilters,
    fetchJournalEntries, selectedJournal, setSelectedJournal,
  }
}
