import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { YearFilterProps } from '@/lib/types';

const YearFilter: React.FC<YearFilterProps & { yearOptions: string[], disabled?: boolean }> = ({ selectedYear, handleYearChange, yearOptions, disabled }) => {
  return (
    <div className="relative">
      <select
        value={selectedYear || ''}
        onChange={handleYearChange}
        disabled={disabled}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="">All Years</option>
        {yearOptions.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
    </div>
  );
};

export default YearFilter;
