'use client';

import { motion } from 'motion/react';

interface BrandLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dots';
  subVariant?: 'bold' | 'minimal';
  isStatic?: boolean;
  className?: string;
}

export function BrandLoader({ 
  size = 'md', 
  variant = 'dots', 
  subVariant = 'minimal',
  isStatic = false, 
  className = "" 
}: BrandLoaderProps) {
  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-4 h-4'
  };

  const barWidths = {
    sm: 'w-0.5',
    md: 'w-1',
    lg: 'w-2'
  };

  const emerald600 = '#059669';
  const whitespace = '#f8fafc';

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        // W shape in dots
        let dots: { r: number, c: number }[] = [];
        let cols = 5;
        let rows = 3;

        if (subVariant === 'bold') {
          cols = 7;
          rows = 3;
          dots = [
            { r: 0, c: 0 }, { r: 0, c: 3 }, { r: 0, c: 6 },
            { r: 1, c: 0 }, { r: 1, c: 3 }, { r: 1, c: 6 },
            { r: 2, c: 2 }, { r: 2, c: 4 }
          ];
        } else if (subVariant === 'minimal') {
          cols = 5;
          rows = 3;
          dots = [
            { r: 0, c: 0 }, { r: 0, c: 2 }, { r: 0, c: 4 },
            { r: 1, c: 0 }, { r: 1, c: 2 }, { r: 1, c: 4 },
            { r: 2, c: 1 }, { r: 2, c: 3 }
          ];
        }

        return (
          <div className={`grid gap-0.5 p-1 w-full h-full`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols * rows }).map((_, i) => {
              const r = Math.floor(i / cols);
              const c = i % cols;
              const isW = dots.some(d => d.r === r && d.c === c);
              
              // Remove background dots
              if (!isW) {
                return (
                  <div 
                    key={i} 
                    className={`${dotSizes[size]} mx-auto`} 
                  />
                );
              }

              return (
                <motion.div
                  key={i}
                  className={`${dotSizes[size]} rounded-full mx-auto`}
                  style={{ 
                    backgroundColor: emerald600,
                    transformStyle: 'preserve-3d'
                  }}
                  animate={!isStatic ? {
                    rotateY: [0, 180, 360],
                    backgroundColor: [emerald600, whitespace, emerald600],
                    scale: [1, 0.85, 1]
                  } : {
                    backgroundColor: emerald600
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: (r + c) * 0.2
                  }}
                />
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${containerSizes[size]} relative overflow-hidden flex items-center justify-center`}>
        {renderVariant()}
      </div>
    </div>
  );
}
