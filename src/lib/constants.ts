import { SidebarItem } from './types'

export const ITEMS_PER_PAGE = 7

export const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', icon: '/icon/dashboard-icon.svg', activeIcon: '/icon/dashboard-icon-active.svg', href: '/', isActive: false },
  { name: 'Jurnal', icon: '/icon/journal-icon.svg', activeIcon: '/icon/journal-icon-active.svg', href: '/journal', isActive: false },
  { name: 'Database', icon: '/icon/database-icon.svg', activeIcon: '/icon/database-icon-active.svg', href: '/database', isActive: false },
  { name: 'Maintenance', icon: '/icon/maintenance-icon.svg', activeIcon: '/icon/maintenance-icon-active.svg', href: '/maintenance', isActive: false },
  { name: 'History', icon: '/icon/history-icon.svg', activeIcon: '/icon/history-icon-active.svg', href: '/history', isActive: false },
  { name: 'Live Chat', icon: '/icon/livechat-icon.svg', activeIcon: '/icon/livechat-icon-active.svg', href: '/chat', isActive: false },
  { name: 'Konten', icon: '/icon/konten-icon.svg', activeIcon: '/icon/konten-icon-active.svg', href: '/content', isActive: false },
  { name: 'Feedback', icon: '/icon/feedback-icon.svg', activeIcon: '/icon/feedback-icon-active.svg', href: '/feedback', isActive: false },
  { name: 'Kelola Promo', icon: '/icon/promo-icon.svg', activeIcon: '/icon/promo-icon-active.svg', href: '/promo', isActive: false },
]