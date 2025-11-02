
import React from 'react';

// Fix: Extend React.HTMLAttributes<HTMLDivElement> to allow passing standard div props like onClick.
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      {...props}
      className={`
        bg-white/30 dark:bg-black/30 
        backdrop-blur-lg 
        rounded-2xl 
        border border-white/20 dark:border-black/20 
        shadow-lg
        p-6 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
