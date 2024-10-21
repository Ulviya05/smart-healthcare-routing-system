import { useState } from 'react';
import {
  Home,
  Ambulance,
  Hospital,
  Menu,
  X,
  Settings,
  LogOut 
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth'; 

export default function Sidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const { logout } = useAuth(); 

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Ambulance, label: 'Emergency', href: '/emergency' },
    { icon: Hospital, label: 'Hospitals', href: '/hospitals' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const handleNavigation = (href) => {
    router.push(href);
  };

  const handleLogout = () => {
    logout(); 
    router.push('/login'); 
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition-colors"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      <div className="hidden lg:block fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition-colors"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen
          bg-white border-r border-gray-200
          w-64 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full pt-16">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    flex items-center w-full px-4 py-2 rounded-lg
                    transition-colors duration-200
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-3 py-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
