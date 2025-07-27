import React from 'react';

interface HeartIconProps {
  className?: string;
  size?: number;
}

export const HeartIcon: React.FC<HeartIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
    >
      {/* 3D Heart Shape based on the uploaded icon */}
      <defs>
        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="heartShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#450a0a" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>
      
      {/* Shadow/bottom part */}
      <path
        d="M50 85 C25 60, 10 40, 10 25 C10 15, 20 5, 35 5 C42 5, 48 8, 50 15 C52 8, 58 5, 65 5 C80 5, 90 15, 90 25 C90 40, 75 60, 50 85 Z"
        fill="url(#heartShadow)"
        transform="translate(3, 3)"
      />
      
      {/* Main heart */}
      <path
        d="M50 85 C25 60, 10 40, 10 25 C10 15, 20 5, 35 5 C42 5, 48 8, 50 15 C52 8, 58 5, 65 5 C80 5, 90 15, 90 25 C90 40, 75 60, 50 85 Z"
        fill="url(#heartGradient)"
      />
      
      {/* Highlight */}
      <path
        d="M35 12 C42 12, 47 15, 50 20 C51 17, 53 15, 58 12 C65 10, 75 15, 78 22 C75 18, 65 15, 58 17 C53 18, 51 20, 50 23 C47 18, 42 15, 35 15 C25 15, 18 20, 18 25 C18 22, 25 12, 35 12 Z"
        fill="#ef4444"
        opacity="0.6"
      />
    </svg>
  );
};