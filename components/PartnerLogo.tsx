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
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
          <Building2 size={16} />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
          {name}
        </span>
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
