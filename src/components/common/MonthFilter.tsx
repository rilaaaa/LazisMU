import React, { useMemo } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { MonthFilterProps } from '@/lib/types'

const MonthFilter: React.FC<MonthFilterProps & { disabled?: boolean }> = ({ selectedMonth, handleMonthChange, disabled }) => {
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }, [])

  return (
    <div className="relative" style={{ color: 'black' }}>
      <select
        value={selectedMonth || ''}
        onChange={handleMonthChange}
        disabled={disabled}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="">All Months</option>
        {monthOptions.map(month => (
          <option key={month} value={month}>
            {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
    </div>
  )
}

export default MonthFilter
