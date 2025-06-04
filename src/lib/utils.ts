import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Muzakki, JournalEntry } from './types'
import { useMemo } from 'react'
import { Chart } from 'chart.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Download chart as image
export const downloadChart = (chartRef: Chart | null, fileName: string) => {
  if (chartRef) {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = chartRef.toBase64Image();
    link.click();
  }
};

export const downloadCardWithChart = (cardRef: HTMLElement | null, fileName: string) => {
  if (cardRef) {
    import('html-to-image').then((htmlToImage) => {
      htmlToImage.toPng(cardRef)
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          link.click();
        })
        .catch((error) => {
          console.error('Error generating image:', error);
        });
    });
  }
};

// Generic filter function
export const filterData = <T>(data: T[], searchTerm: string, keys: (keyof T)[]): T[] => {
  return data.filter(item =>
    keys.some(key => item[key]?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  )
}

// Generic paginate function
export const paginateData = <T>(data: T[], currentPage: number, itemsPerPage: number): T[] => {
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return data.slice(startIndex, endIndex)
}

// Specific filter and paginate functions for Muzakki
export const filterMuzakki = (muzakkiData: Muzakki[], searchTerm: string): Muzakki[] => {
  return filterData(muzakkiData, searchTerm, ['name', 'phoneNumber'])
}

export const paginateMuzakki = (muzakkiData: Muzakki[], currentPage: number, itemsPerPage: number): Muzakki[] => {
  return paginateData(muzakkiData, currentPage, itemsPerPage)
}

// Specific filter and paginate functions for JournalEntry
export const filterJournalEntries = (journalEntries: JournalEntry[], searchTerm: string): JournalEntry[] => {
  return filterData(journalEntries, searchTerm, ['name'])
}

export const paginateJournalEntries = (journalEntries: JournalEntry[], currentPage: number, itemsPerPage: number): JournalEntry[] => {
  return paginateData(journalEntries, currentPage, itemsPerPage)
}

export function useFilteredEntries<T extends { name: string }>(
  entries: T[], 
  searchTerm: string, 
  selectedYear: number | null, 
  selectedMonth: number | null
) {
  return useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());
      const entryYear = entry.name.match(/\d{4}/)?.[0];
      const entryMonth = new Date(entry.name).getMonth() + 1;
      const matchesYear = selectedYear ? entryYear === String(selectedYear) : true;
      const matchesMonth = selectedMonth ? entryMonth === selectedMonth : true;
      return matchesSearch && matchesYear && matchesMonth;
    });
  }, [entries, searchTerm, selectedYear, selectedMonth]);
}

export const getUniqueYears = (entries: { name: string }[]): string[] => {
  return Array.from(new Set(entries.map(entry => entry.name.match(/\d{4}/)?.[0]))).filter(Boolean) as string[];
};

