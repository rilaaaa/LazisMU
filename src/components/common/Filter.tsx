import React, { useMemo } from 'react';
import { Muzakki } from '@/lib/types';

type SelectedFilters = {
  gender: string;
  donationType: string;
  donorType: string;
  year: string;
};

type FilterSectionProps = {
  filterOptions: Record<keyof SelectedFilters, string[]>;
  handleFilterChange: (filterName: keyof SelectedFilters, value: string) => void;
};

export const FilterSection = ({ filterOptions, handleFilterChange }: FilterSectionProps) => (
  <div className="flex flex-wrap gap-4 mb-6">
    {Object.keys(filterOptions).map((filter, index) => {
      const typedFilter = filter as keyof SelectedFilters;
      return (
        <div key={index} className="flex flex-col gap-2">
          <select
            className="border p-2 rounded-md"
            onChange={(e) => handleFilterChange(typedFilter, e.target.value)}
          >
            {filterOptions[typedFilter].map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    })}
  </div>
);

export function useFilteredMuzakki(muzakkiData: Muzakki[], selectedFilters: SelectedFilters) {
  return useMemo(() => {
    return muzakkiData.filter((m) => {
      return (
        (selectedFilters.gender === "Jenis Kelamin" || m.gender === selectedFilters.gender) &&
        (selectedFilters.donationType === "Jenis Donasi" || m.donationType === selectedFilters.donationType) &&
        (selectedFilters.donorType === "Golongan Muzakki" || m.donorType === selectedFilters.donorType) &&
        (selectedFilters.year === "Tahun" || m.year === parseInt(selectedFilters.year))
      );
    });
  }, [muzakkiData, selectedFilters]);
}