
import React from 'react';

interface LogoProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const rectFill = isDark ? '#FFFFFF' : '#0F172A';
  const checkStroke = isDark ? '#0F172A' : 'white';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" fill="none" className={className}>
      <rect x="0" y="0" width="40" height="40" rx="8" fill={rectFill}/>
      <path d="M10 20L15 25L30 10" stroke={checkStroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 30H30" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round"/>
      <text x="50" y="28" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fill={textColor}>
        Laptop<tspan fill="#3B82F6">World</tspan>.
      </text>
    </svg>
  );
};
