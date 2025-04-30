import React from 'react';
import { BellIcon } from '@heroicons/react/20/solid';

export default function Notifications() {
    return (
        <button className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-md hover:shadow-md transition-shadow">
            <BellIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 text-sm">Notifikasi</span>
            <div className="flex items-center justify-center w-7 h-7 bg-gray-100 rounded-full">
                <span className="text-gray-500 text-sm font-medium">9</span>
            </div>
        </button>
    )
}
