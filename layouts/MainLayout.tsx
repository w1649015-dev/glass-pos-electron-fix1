// Fix: Replaced placeholder content with a full implementation of the MainLayout component, including a collapsible sidebar for navigation, a header, and a main content area for pages.
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useI18n } from '../contexts/I18nContext';
import { UserRole } from '../types';

interface NavItemProps {
    to: string;
    icon: string;
    label: string;
    isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `
            flex items-center p-3 my-1 rounded-lg transition-colors
            ${isActive ? 'bg-blue-500/30 text-blue-500 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
        `}
    >
        <i data-lucide={icon} className="w-6 h-6"></i>
        {!isCollapsed && <span className="ml-4 font-semibold">{label}</span>}
    </NavLink>
);

const MainLayout = ({ children }: { children: React.ReactNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
    const { user, logout } = useAuth();
    const { settings, toggleTheme } = useSettings();
    const { t } = useI18n();
    const navigate = useNavigate();
    
    useEffect(() => {
      // @ts-ignore
      if(window.lucide) {
        // @ts-ignore
        window.lucide.createIcons();
      }
    }, [isCollapsed, children]);


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: 'layout-dashboard', label: t('dashboard') },
        { to: '/pos', icon: 'shopping-cart', label: t('pos') },
        { to: '/shift', icon: 'clock', label: t('my_shift') },
        { to: '/products', icon: 'package', label: t('products') },
        { to: '/categories', icon: 'bookmark', label: t('categories') },
    ];

    if(user?.role === UserRole.ADMIN) {
        navItems.push({ to: '/reports', icon: 'bar-chart-2', label: t('reports') });
        navItems.push({ to: '/expenses', icon: 'dollar-sign', label: t('expenses') });
        navItems.push({ to: '/customers', icon: 'users', label: t('customers') });
        navItems.push({ to: '/suppliers', icon: 'truck', label: t('suppliers') });
        navItems.push({ to: '/sales', icon: 'receipt', label: t('sales') });
        navItems.push({ to: '/invoices', icon: 'file-text', label: t('invoices') });
        navItems.push({ to: '/users', icon: 'user-cog', label: t('users') });
    }

    navItems.push({ to: '/settings', icon: 'settings', label: t('settings') });

    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors`}>
            {/* Sidebar */}
            <aside className={`flex flex-col bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <div className={`flex items-center p-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && <h1 className="text-xl font-bold">{settings.storeName}</h1>}
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <i data-lucide={isCollapsed ? 'chevrons-right' : 'chevrons-left'}></i>
                    </button>
                </div>
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0' : 'w-auto'}`}>
                            <p className="font-semibold">{user?.username}</p>
                            <p className="text-sm text-gray-500">{user?.role}</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-2 py-4 overflow-y-auto">
                    {navItems.map(item => <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />)}
                </nav>

            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
                    <div></div>
                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <i data-lucide={settings.theme === 'dark' ? 'sun' : 'moon'}></i>
                        </button>
                        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <i data-lucide="log-out"></i>
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;