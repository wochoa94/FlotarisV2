import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Truck, Users, LogOut, Settings, Wrench, Calendar, BarChart3, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo'; // Import the new Logo component

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
    },
    {
      name: 'Vehicles',
      href: '/vehicles',
      icon: Truck,
    },
    {
      name: 'Drivers',
      href: '/drivers',
      icon: Users,
    },
    {
      name: 'Maintenance Orders',
      href: '/maintenance-orders',
      icon: Wrench,
    },
    {
      name: 'Vehicle Schedules',
      href: '/vehicle-schedules',
      icon: Calendar,
    },
    {
      name: 'Schedules Overview',
      href: '/schedules-overview',
      icon: BarChart3,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-20 hover:lg:w-64 lg:bg-white lg:shadow-lg lg:border-r lg:border-gray-200 group transition-all duration-300 ease-in-out">
        <div className="flex flex-col w-full">
          {/* Logo Section */}
          <div className="flex items-center justify-start h-16 px-3 border-b border-gray-200">
            <Link to="/" className="flex items-center">
              {/* Use the new Logo component */}
              <Logo className="h-14 w-auto flex-shrink-0" />
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-blue-50 text-primary border-r-2 border-primary'
                      : 'text-text-secondary hover:bg-gray-50 hover:text-text-default'
                  }`}
                  title={item.name}
                >
                  <Icon className={`h-6 w-6 flex-shrink-0 ${
                    active ? 'text-primary' : 'text-gray-400'
                  }`} />
                  <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="border-t border-border p-4">
            {/* User Info */}
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                <div className="text-sm font-medium text-text-default truncate">
                  {user?.email}
                </div>
                {user?.isAdmin && (
                  <div className="text-xs text-primary font-medium">Admin</div>
                )}
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={signOut}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-gray-50 hover:text-text-default transition-colors duration-200"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                Sign Out
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Top Navigation */}
      <nav className="lg:hidden bg-background-alt shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors duration-200">
                  <Logo className="h-14 w-auto flex-shrink-0" />
                </div>
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-focus-ring transition-colors duration-200"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>

              {/* User Info and Sign Out */}
              <div className="text-sm text-text-default">
                <span className="font-medium">{user?.email}</span>
                {user?.isAdmin && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={signOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-text-secondary hover:text-text-default hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus-ring transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile navigation overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-background-alt z-40 overflow-y-auto" ref={dropdownRef}>
            <div className="px-4 pt-4 pb-3 space-y-1">
              {/* Mobile header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center">
                  <Logo className="h-14 w-auto flex-shrink-0" />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-focus-ring"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Mobile navigation items */}
              <div className="pt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-blue-50 text-primary'
                          : 'text-text-secondary hover:bg-gray-50 hover:text-text-default'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${
                        isActive(item.href) ? 'text-primary' : 'text-gray-400'
                      }`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}