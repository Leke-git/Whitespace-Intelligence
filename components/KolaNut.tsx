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
  const R = size * 0.35;
  const r = size * 0.1;
  const innerR = size * 0.12;

  const getLGAColor = (lobesArr: boolean[]) => {
    const n = lobesArr.filter(Boolean).length;
    if (n >= 5) return '#10b981'; // Emerald 500
    if (n >= 3) return '#f59e0b'; // Amber 500
    if (n >= 1) return '#f97316'; // Orange 500
    return '#94a3b8'; // Slate 400
  };

  const activeColor = color || getLGAColor(lobes);

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {/* Technical Radar Background */}
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="absolute inset-0 pointer-events-none opacity-20"
      >
        {/* Concentric Rings */}
        <circle cx={cx} cy={cy} r={size * 0.45} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
        <circle cx={cx} cy={cy} r={size * 0.35} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
        <circle cx={cx} cy={cy} r={size * 0.25} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
        
        {/* Crosshairs */}
        <line x1={0} y1={cy} x2={size} y2={cy} stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
        <line x1={cx} y1={0} x2={cx} y2={size} stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
        
        {/* Degree Markers */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line 
            key={deg}
            x1={cx + Math.cos(deg * Math.PI / 180) * (size * 0.42)}
            y1={cy + Math.sin(deg * Math.PI / 180) * (size * 0.42)}
            x2={cx + Math.cos(deg * Math.PI / 180) * (size * 0.48)}
            y2={cy + Math.sin(deg * Math.PI / 180) * (size * 0.48)}
            stroke="currentColor" strokeWidth="1" className="text-slate-400"
          />
        ))}
      </svg>

      {/* Scanning Animation */}
      <motion.div 
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none opacity-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, ${activeColor} 25%, transparent 50%)`
        }}
      />

      <motion.svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className={`relative z-10 ${interactive ? 'cursor-pointer' : ''}`}
        whileHover={interactive ? { scale: 1.02 } : {}}
      >
        {/* Husk / Outer Glow */}
        <circle 
          cx={cx} cy={cy} r={R + r} 
          fill="none" 
          stroke={activeColor} 
          strokeWidth="1" 
          strokeDasharray="4 4" 
          className="opacity-20" 
        />
        
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
                rx={r * 0.8}
                ry={r * 1.3}
                transform={`rotate(${rot} ${lx} ${ly})`}
                fill={active ? activeColor : 'none'}
                stroke={active ? 'none' : '#cbd5e1'}
                strokeWidth={active ? 0 : 1.5}
                opacity={active ? 0.9 : 0.3}
                className="transition-all duration-500"
              />
              {/* Connector Lines */}
              <line 
                x1={cx} y1={cy} 
                x2={lx} y2={ly}
                stroke={active ? activeColor : '#cbd5e1'} 
                strokeWidth="0.5" 
                opacity={active ? 0.4 : 0.1}
              />
            </g>
          );
        })}

        {/* Center Nut / Core */}
        <circle cx={cx} cy={cy} r={innerR * 1.2} fill="white" stroke={activeColor} strokeWidth="2" />
        <circle cx={cx} cy={cy} r={innerR * 0.8} fill={activeColor} />
        
        {/* Text */}
        <text 
          x={cx} y={cy + 1} 
          textAnchor="middle" 
          dominantBaseline="central" 
          fontSize={size > 100 ? 12 : 8} 
          fill="white" 
          fontWeight="900"
          className="font-mono"
        >
          {orgs}
        </text>
      </motion.svg>

      {/* Micro Labels */}
      {size > 150 && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <span className="absolute top-2 left-2 text-[8px] font-mono text-slate-400 uppercase tracking-tighter">Scan_Active</span>
          <span className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-400 uppercase tracking-tighter">ID_{orgs.toString().padStart(3, '0')}</span>
        </div>
      )}
    </div>
  );
}
