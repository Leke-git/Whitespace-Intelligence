'use client';

import { useState } from 'react';
import { Building2, Globe, Shield, Users, Activity, Heart, Zap, Award } from 'lucide-react';

interface PartnerLogoProps {
  name: string;
  logo: string;
  className?: string;
}

const ICONS = [Building2, Globe, Shield, Users, Activity, Heart, Zap, Award];

export function PartnerLogo({ name, logo, className = "" }: PartnerLogoProps) {
  // Use a stable hash of the name to pick an icon
  const iconIndex = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % ICONS.length;
  const Icon = ICONS[iconIndex];

  return (
    <div className={`flex items-center gap-3 ${className} group/logo`}>
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/logo:text-emerald-500 group-hover/logo:border-emerald-100 group-hover/logo:bg-emerald-50 transition-all duration-500">
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/logo:text-slate-600 transition-colors duration-500 whitespace-normal leading-tight max-w-[120px]">
        {name}
      </span>
    </div>
  );
}
