'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { sidebarItems } from '@/lib/constants'

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  useEffect(() => {
    const activeItem = sidebarItems.findIndex(item => item.href === pathname)
    setActiveIndex(activeItem !== -1 ? activeItem : null)
  }, [pathname])

  const handleItemClick = (index: number) => {
    setActiveIndex(index)
    if (window.innerWidth < 768) {
      setIsOpen(false)
    }
  }

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    if (isLeftSwipe && isOpen) {
      setIsOpen(false)
    }
  }

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <Image src="/img/lazismu-icon.png" alt="Lazismu Logo" width={120} height={40} />
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="sr-only">Close sidebar</span>
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      <nav className="mt-5 px-2 space-y-1">
        {sidebarItems.map((item, index) => (
          <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
              activeIndex === index
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
            onClick={() => handleItemClick(index)}
          >
            <Image
              src={activeIndex === index ? item.activeIcon : item.icon}
              alt={`${item.name} Icon`}
              width={20}
              height={20}
              className="mr-3 flex-shrink-0"
            />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar

