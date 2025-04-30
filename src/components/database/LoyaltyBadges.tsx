import Image from 'next/image';
import { useMemo } from 'react';
import React from 'react';

interface Badge {
  type: string;
  count: number;
  image: string;
}

interface BadgeCardProps {
  badge: Badge;
}

interface LoyaltyBadgesProps {
  muzakkiData: { donorType: string }[];
}

function Card({children, className}: {children: React.ReactNode, className?: string}) {
  return <div className={`bg-white rounded-lg shadow-md ${className}`}>{children}</div>
}

function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <Card className="p-4 sm:p-6 w-full">
      <div className="flex items-start justify-between mb-2 sm:mb-4">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="flex items-center justify-center">
              <Image 
                src={badge.image} 
                alt={`${badge.type} badge`} 
                width={50} 
                height={50}
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
              />
            </div>
          </div>
        </div>
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-600">
          {badge.count}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-gray-500 text-xs sm:text-sm">
        <span className="mb-1 sm:mb-0">{badge.type}</span>
        <span className="hidden sm:inline">Jumlah muzakki</span>
      </div>
    </Card>
  )
}

export default function LoyaltyBadges({ muzakkiData }: LoyaltyBadgesProps) {
  const loyaltyBadges: Badge[] = useMemo(() => {
    const calculateBadgeCount = (type: string) => {
      switch (type) {
        case 'Kecil Jarang':
          return muzakkiData.filter(m => m.donorType === 'Kecil Jarang').length;
        case 'Besar Jarang':
          return muzakkiData.filter(m => m.donorType === 'Besar Jarang').length;
        case 'Kecil Sering':
          return muzakkiData.filter(m => m.donorType === 'Kecil Sering').length;
        case 'Besar Sering':
          return muzakkiData.filter(m => m.donorType === 'Besar Sering').length;
        default:
          return 0;
      }
    };

    return [
      { type: 'Kecil Jarang', count: calculateBadgeCount('Kecil Jarang'), image: '/icon/sporadic.svg' },
      { type: 'Besar Jarang', count: calculateBadgeCount('Besar Jarang'), image: '/icon/regular.svg' },
      { type: 'Kecil Sering', count: calculateBadgeCount('Kecil Sering'), image: '/icon/generous.svg' },
      { type: 'Besar Sering', count: calculateBadgeCount('Besar Sering'), image: '/icon/major.svg' },
    ];
  }, [muzakkiData]);

  return (
    <section className="mb-6">
      <h2 className="text-lg font-medium mb-4">Loyalty Badges</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loyaltyBadges.map((badge) => (
          <BadgeCard key={badge.type} badge={badge} />
        ))}
      </div>
    </section>
  )
}

