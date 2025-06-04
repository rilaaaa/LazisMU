'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import LoyaltyBadges from '@/components/database/LoyaltyBadges'
import SearchBar from '@/components/common/SearchBar'
import MuzakkiTable from '@/components/database/MuzakkiTable'
import Pagination from '@/components/common/Pagination'
import Notifications from '@/components/common/Notifications'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import { filterMuzakki, paginateMuzakki } from '@/lib/utils'
import { getMuzakki } from '@/api/database'

export default function DatabasePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [muzakkiData, setMuzakkiData] = useState([])

  const fetchMuzzakiData = async () => {
    const data = await getMuzakki()
    setMuzakkiData(data)
  }

  useEffect(() => {
    fetchMuzzakiData()
  }, [])

  const filteredMuzakki = useMemo(() => filterMuzakki(muzakkiData, searchTerm), [muzakkiData, searchTerm])

  const totalPages = useMemo(() => Math.ceil(filteredMuzakki.length / ITEMS_PER_PAGE), [filteredMuzakki])

  const currentEntries = useMemo(() => paginateMuzakki(filteredMuzakki, currentPage, ITEMS_PER_PAGE), [filteredMuzakki, currentPage])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleRefresh = async () => {
    await fetchMuzzakiData()
  }

  return (
    <div className="p-6" style={{ color: 'black' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Database Muzakki</h1>
        <Notifications />
      </div>

      <LoyaltyBadges muzakkiData={muzakkiData} />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0">
        <button className="flex items-center text-gray-600 hover:text-gray-900" onClick={handleRefresh}>
          <ArrowPathIcon className="h-5 w-5 mr-1" />
          Refresh
        </button>
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClearSearch={clearSearch}
        />
      </div>

      <MuzakkiTable muzakkiData={currentEntries} currentPage={currentPage} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredMuzakki.length}
      />
    </div>
  )
}