import { ReactNode } from 'react';

export type SidebarItem = {
  name: string;
  icon: string;
  activeIcon: string;
  href: string;
  isActive?: boolean;
};

export type LoyaltyBadge = {
  type: 'Kecil Jarang' | 'Besar Jarang' | 'Kecil Sering' | 'Besar Sering';
  count: number;
  image: string;
};

export type FileUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
};

export type MonthFilterProps = {
  selectedMonth: number | null;
  handleMonthChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
};

export type YearFilterProps = {
  selectedYear: number | null;
  handleYearChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  yearOptions: string[];
  disabled?: boolean;
};

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  totalItems: number;
};

export type SearchBarProps = {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
};

export type ChartSectionProps = {
  filteredMuzakki: Muzakki[];
};

export type JournalTableProps = {
  entries: JournalEntry[];
  currentPage: number;
  onDeleteSuccess: () => void;
  selectedJournal: JournalEntry | null;
  setSelectedJournal: (journal: JournalEntry | null) => void;
  searchTerm: string;
  filteredEntries: JournalEntry[];
  isLoading: boolean;
};

export type JournalEntry = {
  [x: string]: any;
  jenisJurnal: ReactNode;
  category: string;
  id: number;
  name: string;
  JurnalData: JurnalDataRow[];
};

export type JurnalRow = {
  id: number;
  name: string;
};

export type JurnalDataRow = {
  nominal: ReactNode;
  sumber_dana: any;
  id: number;
  nama: string;
  no_hp?: string;
  zis?: string;
  via?: string;
  tahun: number;
  jenis_donatur: string;
};

export interface JournalDetailTableProps {
  journal: JournalEntry;
  searchTerm: string;
}

export type Muzakki = {
  gender: string;
  is_repeat: boolean;
  id: number;
  name: string;
  nominal: number;
  phoneNumber: string;
  occupation: string;
  donationType: string;
  donorType: string;
  category: string;
  source: string;
  status: string;
  year: number;
};
