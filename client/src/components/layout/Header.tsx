import { Menu, Bell, User as UserIcon, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTierBadge = () => {
    const tier = user?.subscriptionTier || 'FREE';
    const colors = {
      FREE: 'bg-gray-100 text-gray-800',
      BASIC: 'bg-blue-100 text-blue-800',
      PRO: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-primary-100 text-primary-800',
    };
    return (
      <span className={`badge ${colors[tier]}`}>
        {tier}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-gray-900">
            Etsy Compliance Checker
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
              <UserIcon className="h-4 w-4 text-primary-600" />
            </div>
            <span className="hidden text-sm font-medium md:block">
              {user?.email?.split('@')[0]}
            </span>
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
              <div className="border-b border-gray-100 px-4 pb-3">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  {getTierBadge()}
                </div>
              </div>
              <Link
                to="/settings"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserIcon className="h-4 w-4" />
                Account Settings
              </Link>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
