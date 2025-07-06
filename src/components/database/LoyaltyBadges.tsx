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
    <Card className="p-4 sm:p-6 w-full min-h-[240px]">
      <div className="flex flex-col justify-between h-full">
        <div className="flex flex-col items-center mb-4 space-y-2">
          <Image 
            src={badge.image} 
            alt={`${badge.type} badge`}
            width={96} 
            height={96}
            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
          />
          <div className="text-base sm:text-lg text-gray-700 font-medium text-center">
            {badge.type}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-700">
            {badge.count}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Jumlah muzakki</div>
        </div>
      </div>
    </Card>
  );
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
        case 'Momentum':
          return muzakkiData.filter(m => m.donorType === 'Momentum').length;
        case 'Calon':
          return muzakkiData.filter(m => m.donorType === 'Calon').length;
        default:
          return 0;
      }
    };

    return [
      { type: 'Kecil Jarang', count: calculateBadgeCount('Kecil Jarang'), image: '/icon/medalihijau.svg' },
      { type: 'Besar Jarang', count: calculateBadgeCount('Besar Jarang'), image: '/icon/medalibiru.svg' },
      { type: 'Kecil Sering', count: calculateBadgeCount('Kecil Sering'), image: '/icon/medalikuning.svg' },
      { type: 'Besar Sering', count: calculateBadgeCount('Besar Sering'), image: '/icon/medalimerah.svg' },
      { type: 'Momentum', count: calculateBadgeCount('Momentum'), image: '/icon/medaliungu.svg' },
      { type: 'Calon', count: calculateBadgeCount('Calon'), image: '/icon/medalicoklat.svg' },
    ];
  }, [muzakkiData]);

  return (
    <section className="mb-6">
      <h2 className="text-lg font-medium mb-4">Loyalty Badges</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        {loyaltyBadges.map((badge) => (
          <BadgeCard key={badge.type} badge={badge} />
        ))}
      </div>
    </section>
  )
}