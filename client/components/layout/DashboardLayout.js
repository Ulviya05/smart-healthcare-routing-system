import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useRouter } from 'next/router';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      setIsSidebarOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main
        className={`
          transition-all duration-300 ease-in-out
          pt-16 min-h-screen
          ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
        `}
      >
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}