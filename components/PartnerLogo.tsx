'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2 } from 'lucide-react';

interface PartnerLogoProps {
  name: string;
  logo: string;
  className?: string;
}

export function PartnerLogo({ name, logo, className = "" }: PartnerLogoProps) {
  const [error, setError] = useState(false);

  // Use clearbit directly as primary, unavatar as secondary, then fallback
  const primaryLogo = logo.replace('unavatar.io/clearbit/', 'logo.clearbit.com/');
  
  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
          <Building2 size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={primaryLogo}
        alt={name}
        fill
        className="object-contain"
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
