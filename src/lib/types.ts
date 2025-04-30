// Sidebar related types
export type SidebarItem = {
  name: string
  icon: string
  activeIcon: string
  href: string
  isActive?: boolean
}

// Loyalty Badge related types
export type LoyaltyBadge = {
  type: 'Kecil Jarang' | 'Besar Jarang' | 'Kecil Sering' | 'Besar Sering'
  count: number
  image: string
}

// File Upload Modal related types
export type FileUploadModalProps = {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

// Filter related types
export type MonthFilterProps = {
  selectedMonth: number | null
  handleMonthChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
}

export type YearFilterProps = {
  selectedYear: number | null
  handleYearChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  yearOptions: string[];
  disabled?: boolean
}

// Pagination related types
export type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
  totalItems: number
}

// Search Bar related types
export type SearchBarProps = {
  searchTerm: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
}

// Chart Section related types
export type ChartSectionProps = {
  filteredMuzakki: Muzakki[];
}

// Journal related types
export type JournalTableProps = {
  entries: JournalEntry[],
  currentPage: number,
  onDeleteSuccess: () => void
  selectedJournal: JournalEntry | null
  setSelectedJournal: (journal: JournalEntry | null) => void
  searchTerm: string
  filteredEntries: JournalEntry[]
  isLoading: boolean
}

export type JournalEntry = {
  id: number;
  name: string;
  JurnalData: JurnalDataRow[];
}

export type JurnalRow = {
  id: number;
  name: string;
}

export type JurnalDataRow = {
  id: number,
  nama: string,
  no_hp: string,
  zis: string,
  via: string,
  tahun: number,
  jenis_donatur: string
}

export interface JournalDetailTableProps {
  journal: JournalEntry;
  searchTerm: string;
}

// Muzakki related types
export type Muzakki = {
  id: number
  name: string
  phoneNumber: string
  gender: string
  age: number
  occupation: string
  donationType: string
  donorType: string
  status: string
  year: number
}