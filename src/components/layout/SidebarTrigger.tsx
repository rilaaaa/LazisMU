'use client'

import React, { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'

interface SidebarTriggerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SidebarTrigger: React.FC<SidebarTriggerProps> = ({ isOpen, setIsOpen }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50 

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // otherwise the swipe is fired even with usual touch events
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isRightSwipe = distance < -minSwipeDistance
    if (isRightSwipe && !isOpen) {
      setIsOpen(true)
    }
  }

  useEffect(() => {
    const handleSwipe = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX
      if (touchEndX < 20 && !isOpen) {
        setIsOpen(true)
      }
    }

    document.addEventListener('touchend', handleSwipe)

    return () => {
      document.removeEventListener('touchend', handleSwipe)
    }
  }, [isOpen, setIsOpen])

  return (
    <button
      onClick={() => setIsOpen(true)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`md:hidden fixed top-1/2 -translate-y-1/2 left-0 bg-white p-2 rounded-r-md shadow-md transition-all duration-300 ${
        isOpen ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      } hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      aria-label="Open sidebar"
    >
      <ChevronRight className="h-6 w-6 text-gray-600" />
    </button>
  )
}

export default SidebarTrigger

