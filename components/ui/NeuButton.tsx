import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// Fix: Extend HTMLMotionProps<'button'> to correctly include standard button attributes and motion props.
interface NeuButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const NeuButton: React.FC<NeuButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  const primaryClasses = 'bg-blue-500 text-white';
  const secondaryClasses = 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        px-6 py-2 rounded-lg font-semibold transition-all duration-200
        shadow-neumorphic-light dark:shadow-neumorphic-dark
        hover:shadow-neumorphic-light-inset dark:hover:shadow-neumorphic-dark-inset
        active:shadow-neumorphic-light-inset dark:active:shadow-neumorphic-dark-inset
        ${variant === 'primary' ? primaryClasses : secondaryClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default NeuButton;