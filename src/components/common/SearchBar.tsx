import React from 'react'
import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { SearchBarProps } from '@/lib/types'

export default function SearchBar({ searchTerm, onSearchChange, onClearSearch }: SearchBarProps) {
  return (
    <div className="relative w-full sm:w-auto">
      <input
        type="text"
        placeholder="Cari"
        value={searchTerm}
        onChange={onSearchChange}
        className="w-full sm:w-64 bg-white border border-gray-300 rounded-md pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <XCircleIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}