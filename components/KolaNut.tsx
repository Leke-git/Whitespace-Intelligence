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

  const activeColor = color || getLGAColor(lobes);

  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className={interactive ? 'cursor-pointer' : ''}
      whileHover={interactive ? { scale: 1.05 } : {}}
    >
      {/* Husk */}
      <circle cx={cx} cy={cy} r={R + r * 0.6} fill="#7A3B10" opacity="0.07" stroke="#7A3B10" strokeWidth="1" />
      
      {/* Lobes */}
      {lobes.map((active, i) => {
        const angle = (i * 60 - 90) * Math.PI / 180;
        const lx = cx + Math.cos(angle) * R;
        const ly = cy + Math.sin(angle) * R;
        const rot = i * 60 - 90;
        
        return (
          <g key={i}>
            <ellipse
              cx={lx}
              cy={ly}
              rx={r * 0.68}
              ry={r * 1.1}
              transform={`rotate(${rot} ${lx} ${ly})`}
              fill={active ? activeColor : 'none'}
              stroke={active ? 'none' : '#B4B2A9'}
              strokeWidth={active ? 0 : 1}
              strokeDasharray={active ? 'none' : '4 3'}
              opacity={active ? 0.82 : 0.45}
            />
            <line 
              x1={cx} y1={cy} 
              x2={cx + Math.cos((i * 60 - 60) * Math.PI / 180) * (R + r * 0.5)} 
              y2={cy + Math.sin((i * 60 - 60) * Math.PI / 180) * (R + r * 0.5)}
              stroke="#7A3B10" strokeWidth="0.7" opacity="0.35"
            />
          </g>
        );
      })}

      {/* Center Nut */}
      <circle cx={cx} cy={cy} r={innerR * 1.4} fill="#8B3A0F" opacity="0.85" />
      <circle cx={cx} cy={cy} r={innerR} fill="#A04412" opacity="0.9" />
      
      {/* Text */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={size > 100 ? 14 : 9} fill="white" fontWeight="600">
        {orgs}
      </text>
      {size > 100 && (
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill="white" opacity="0.7">
          orgs
        </text>
      )}
    </motion.svg>
  );
}
