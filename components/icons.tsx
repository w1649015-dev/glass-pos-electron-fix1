// components/icons.tsx - Common UI Icons using Heroicons
import React from 'react';

// Icon wrapper component
interface IconProps {
  className?: string;
  onClick?: () => void;
  title?: string;
}

const createIcon = (path: string) => (props: IconProps = {}) => {
  const { className = "h-5 w-5", onClick, title } = props;
  
  if (onClick) {
    return (
      <svg 
        className={className} 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor"
        onClick={onClick}
        title={title}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    );
  }
  
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor"
      title={title}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
};

// Navigation & Layout Icons
export const HomeIcon = createIcon("M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25");

// CRUD Icons
export const PlusIcon = createIcon("M12 4.5v15m7.5-7.5h-15");
export const PencilIcon = createIcon("M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10");
export const TrashIcon = createIcon("M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16");
export const EditIcon = createIcon("M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z");

// Data Management Icons
export const FolderIcon = createIcon("M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z");
export const FolderOpenIcon = createIcon("M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H9.5a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 018.5 3H8.7a1.5 1.5 0 00-1.06.44l-1.7 1.7a1.5 1.5 0 000 2.12L5.2 12.5A.25.25 0 005.45 12.7H8.5a.25.25 0 00-.25.25v6.5a.25.25 0 00.25.25H9a.25.25 0 00.25-.25V14a.25.25 0 00.25-.25h1.3a.25.25 0 00.25-.25v-2.5a.25.25 0 00-.25-.25H12.5a.25.25 0 00-.25.25v1.04a.25.25 0 00-.25.25v2.5a.25.25 0 00.25.25H16.5a.25.25 0 00.25-.25v-6.5a.25.25 0 00-.25-.25zM6.9 3a.25.25 0 01.25.25v2.5A.25.25 0 016.4 6.5H6a.25.25 0 01-.25-.25V3.25A.25.25 0 016 3z");

// User & Contact Icons
export const UserIcon = createIcon("M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z");
export const UsersIcon = createIcon("M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z");

// Business Icons
export const BuildingOfficeIcon = createIcon("M2.25 21h19.5m-18-5.25v3.75m0 3.75h10.5a2.25 2.25 0 002.25-2.25v-5.25A2.25 2.25 0 0012.75 5H5.25A2.25 2.25 0 003 7.25v5.25A2.25 2.25 0 005.25 15h10.5A2.25 2.25 0 0018 12.75v3.75m-18 3.75h16.5m-16.5 3.75h16.5m-16.5 3.75H12a2.25 2.25 0 01-2.25-2.25V7.25a.75.75 0 011.5 0v6a2.25 2.25 0 002.25 2.25H18m-6-4.5V19.5");
export const ChartBarIcon = createIcon("M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.25m6.75 3v9m-9.5 9.5v2.25m3-4.5v4.5m3-6.75v6.25m6.75 3v9m-9.5 9.5v2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z");

// Communication Icons
export const PhoneIcon = createIcon("M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z");
export const EnvelopeIcon = createIcon("M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75");
export const MapPinIcon = createIcon("M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z");

// Status Icons
export const CheckIcon = createIcon("M4.5 12.75l6 6 9-13.5");
export const XMarkIcon = createIcon("M6 18L18 6M6 6l12 12");
export const ExclamationTriangleIcon = createIcon("M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z");

// Navigation Icons
export const ChevronLeftIcon = createIcon("M15.75 19.5L8.25 12l7.5-7.5");
export const ChevronRightIcon = createIcon("M8.25 4.5l7.5 7.5-7.5 7.5");
export const ChevronUpIcon = createIcon("M4.5 15.75l7.5-7.5 7.5 7.5");
export const ChevronDownIcon = createIcon("M19.5 10.5l-7.5 7.5-7.5-7.5");

// Menu & Interface Icons
export const Bars3Icon = createIcon("M3.75 6.75h3.5v3.5h-3.5V6.75zm0 6h3.5v3.5h-3.5v-3.5zM3.75 18.75h3.5v3.5h-3.5v-3.5zM9 6.75h6v3.5H9V6.75zm0 6h6v3.5H9v-3.5zM15.5 6.75h3.5v3.5h-3.5V6.75zm0 6h3.5v3.5h-3.5v-3.5z");

// POS Specific Icons
export const ShoppingCartIcon = createIcon("M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h3.375c.621 0 1.125-.504 1.125-1.125V11.25a3.375 3.375 0 00-3.375-3.375h3.215c.621 0 1.125.504 1.125 1.125V21.75c0 .621-.504 1.125-1.125 1.125H7.5zM9 14.25l1.5 3 3 3.375a.75.75 0 001.5 0l-1.5-3-3-3.375h-3.75V9.75H7.5v1.5H6.75a.75.75 0 000-1.5H6.75V3h1.5m-3 3.75l-.75.75H3.75M3.75 12.75V3h1.5v9.75M6 12.75h9v3.75H6v-3.75zm3 3.75h-1.5v4.5H3.75V15.75H2.25v1.5H3.75V21h9.75V18a.75.75 0 00-.75-.75z");
export const CashIcon = createIcon("M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75H3.75A2.25 2.25 0 011.5 16.5v-9A2.25 2.25 0 013.75 5.25h18a2.25 2.25 0 012.25 9.75v6.75c0 1.36-.84 2.5-1.99 2.5H18.75V18.75M5.25 14.25h1.5m.75-1.5l.75-2.25h.75l-.75 2.25.75 2.25-.75 1.5-.75-1.5");
export const CreditCardIcon = createIcon("M2.25 8.25h19.5M2.25 9h19.5c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H2.25M2.25 9h19.5v9.75c0 .621-.504 1.125-1.125 1.125H2.25");

// Report & Analytics Icons
export const DocumentTextIcon = createIcon("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z");
export const ChartPieIcon = createIcon("M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z");
export const CalendarIcon = createIcon("M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5");

// Settings Icons
export const CogIcon = createIcon("M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5M3.75 6a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75");
export const Cog6ToothIcon = createIcon("M15.75 10.5l3.75-3.75a.75.75 0 00-1.06-1.06L14.25 9.94M15.75 13.5l3.75-3.75a.75.75 0 00-1.06-1.06L14.25 12.44M3.375 13.5l-3.75-3.75a.75.75 0 00-1.06 1.06L3.75 16.56M6.75 10.5l-3.75 3.75a.75.75 0 00-1.06 1.06L3.75 12.69m12.75-1.5l-3.75 3.75a.75.75 0 001.06 1.06L12.75 15.31M16.5 6.75L12 2.25");
export const SlidersIcon = createIcon("M3 4.5h1.5l1.5 3H3V7.5H1.5l-1.5 3H3v-1.5M3 10.5h1.5l1.5 3H3v-1.5M3 13.5h1.5l1.5 3H3v-1.5M4.5 17.25H15m1.5-13.5H15m1.5 3H15m1.5 3H18m1.5 3H21M12 2.25V12m-9 9.75H3m18 0H21m0-6.75H21M3 17.25h18M3 13.5H21m0 0v-2.25H3V13.5M12 2.25V7.5h7.5V2.25M3 7.5h18V2.25M3 12H21m0 0V7.5");

// Utility Icons
export const MagnifyingGlassIcon = createIcon("M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6");
export const FunnelIcon = createIcon("M3 4.5h14.25M3 9h9.75M3 13.5h5.25m-5.25 3h9.75M3 18h13.5m-5.25-13.5h13.5M3 18h13.5m0-3h13.5M3 7.5H21");
export const ArrowPathIcon = createIcon("M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99");


// Theme Icons (Light/Dark Mode) - Example
export const SunIcon = createIcon("M12 3v1.5m0 15V21m8.485-8.485h1.5M3 12h1.5m12.02-6.364l1.06 1.06M4.92 19.08l1.06 1.06m0-14.142l-1.06 1.06M19.08 19.08l-1.06 1.06M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z");
export const MoonIcon = createIcon("M21 12.79A9 9 0 1111.21 3a7.5 7.5 0 009.79 9.79z");

// DocumentIcon
export const DocumentIcon = createIcon("M7.5 3.75A2.25 2.25 0 005.25 6v12a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25V9a2.25 2.25 0 00-2.25-2.25H12l-4.5-3.75zM12 3v5.25h5.25");

// Default export
export default {
  // Navigation
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  
  // CRUD
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  
  // Data
  FolderIcon,
  FolderOpenIcon,
  Bars3Icon,
  
  // Users
  UserIcon,
  UsersIcon,
  
  // Business
  BuildingOfficeIcon,
  ChartBarIcon,
  ChartPieIcon,
  
  // Communication
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  
  // POS
  ShoppingCartIcon,
  CashIcon,
  CreditCardIcon,
  
  // Reports
  DocumentTextIcon,
  CalendarIcon,
  
  // Settings
  CogIcon,
  Cog6ToothIcon,
  SlidersIcon,
  
  // Utility
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,

  // Theme
  SunIcon,
  MoonIcon,

  // Document
  DocumentIcon,
};