'use client';

import { motion } from 'motion/react';

interface BrandLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLoader({ size = 'md', className = "" }: BrandLoaderProps) {
  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const innerSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${containerSizes[size]} bg-emerald-600 rounded-lg relative overflow-hidden`}>
        <motion.div
          className={`${innerSizes[size]} bg-white rounded-sm absolute`}
          animate={{
            x: [4, 20, 20, 4, 4],
            y: [4, 4, 20, 20, 4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            left: 0,
            top: 0
          }}
        />
      </div>
    </div>
  );
}
