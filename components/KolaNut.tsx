'use client';

import { motion } from 'motion/react';

interface KolaNutProps {
  sectors: string[];
  activeSectors: string[];
  orgCount: number;
  size?: number;
  interactive?: boolean;
  color?: string;
}

export function KolaNut({ sectors, activeSectors, orgCount, size = 200, interactive = false, color }: KolaNutProps) {
  const lobes = sectors.map(s => activeSectors.includes(s));
  const orgs = orgCount;
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;
  const r = size * 0.12;
  const innerR = size * 0.15;

  const getLGAColor = (lobesArr: boolean[]) => {
    const n = lobesArr.filter(Boolean).length;
    if (n >= 5) return '#C4541A';
    if (n >= 3) return '#BA7517';
    if (n >= 1) return '#D85A30';
    return '#B4B2A9';
  };

  const activeColor = color || '#C4541A';

  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className={interactive ? 'cursor-pointer' : ''}
      whileHover={interactive ? { scale: 1.05 } : {}}
    >
      {/* Background Circle */}
      <circle cx={cx} cy={cy} r={R + r * 1.2} fill="#1A1A1A" opacity="0.4" />
      
      {/* Lobes (Petals) */}
      {lobes.map((active, i) => {
        const angle = (i * (360 / sectors.length) - 90) * Math.PI / 180;
        const lx = cx + Math.cos(angle) * R;
        const ly = cy + Math.sin(angle) * R;
        const rot = i * (360 / sectors.length) - 90;
        
        return (
          <g key={i}>
            <ellipse
              cx={lx}
              cy={ly}
              rx={r * 0.8}
              ry={r * 1.3}
              transform={`rotate(${rot} ${lx} ${ly})`}
              fill={active ? activeColor : 'none'}
              stroke={active ? 'none' : '#4A4A4A'}
              strokeWidth={active ? 0 : 1.5}
              strokeDasharray={active ? 'none' : '4 3'}
              opacity={active ? 0.9 : 0.3}
            />
          </g>
        );
      })}

      {/* Center Nut (Core) */}
      <circle cx={cx} cy={cy} r={innerR * 1.6} fill="#2A2A2A" />
      <circle cx={cx} cy={cy} r={innerR * 1.3} fill={activeColor} opacity="0.3" />
      <circle cx={cx} cy={cy} r={innerR} fill={activeColor} opacity="0.8" />
      
      {/* Text */}
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="central" fontSize={size > 100 ? 18 : 11} fill="white" fontWeight="900">
        {orgs}
      </text>
      {size > 100 && (
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="white" opacity="0.6" fontWeight="700" className="uppercase tracking-widest">
          orgs
        </text>
      )}
    </motion.svg>
  );
}
