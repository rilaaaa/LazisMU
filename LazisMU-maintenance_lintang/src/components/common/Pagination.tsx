import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaginationProps } from '@/lib/types'

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
}: PaginationProps) {
  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('...')
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1)
        pageNumbers.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        pageNumbers.push(1)
        pageNumbers.push('...')
        pageNumbers.push(currentPage - 1)
        pageNumbers.push(currentPage)
        pageNumbers.push(currentPage + 1)
        pageNumbers.push('...')
        pageNumbers.push(totalPages)
      }
    }

    return pageNumbers
  }

  const onNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const onPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const renderButton = (label: React.ReactNode, onClick: () => void, disabled: boolean, ariaLabel: string) => (
    <button
      className={cn(
        "relative inline-flex items-center rounded px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 focus:outline-offset-0",
        disabled && "pointer-events-none opacity-50"
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  )

  return (
    <div className="mt-4 flex flex-col items-center justify-between border-t border-gray-200 bg-gray-100 px-4 py-3 sm:flex-row sm:px-6">
      <div className="mb-4 sm:mb-0">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
          <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </p>
      </div>
      <nav className="flex items-center justify-center" aria-label="Pagination">
        {renderButton(<ChevronLeft className="h-5 w-5" aria-hidden="true" />, onPrevious, currentPage === 1, "Previous page")}
        <div className="hidden md:flex">
          {renderPageNumbers().map((pageNumber, index) => (
            <React.Fragment key={index}>
              {pageNumber === '...' ? (
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">
                  <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                </span>
              ) : (
                <button
                  className={cn(
                    "relative inline-flex items-center px-4 py-2 text-sm font-medium hover:bg-gray-100 focus:z-20 focus:outline-offset-0",
                    pageNumber === currentPage ? "bg-gray-200 text-black rounded" : "text-gray-900"
                  )}
                  onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex md:hidden">
          <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        {renderButton(<ChevronRight className="h-5 w-5" aria-hidden="true" />, onNext, currentPage === totalPages, "Next page")}
      </nav>
    </div>
  )
}

