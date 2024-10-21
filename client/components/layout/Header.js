import { useState, useEffect } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { socket } from '../../services/socket';

export default function Header({ toggleSidebar, isSidebarOpen }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    socket.on('new-emergency', (emergency) => {
      const newNotification = {
        _id: Date.now(),
        type: 'EMERGENCY_UPDATE',
        message: `New emergency case: ${emergency.primaryComplaint}`,
        relatedEmergency: emergency._id,
        read: false,
        createdAt: new Date()
      };
      setNotifications(prev => [newNotification, ...prev]);
    });

    socket.on('new-hospital-added', (hospital) => {
      const newNotification = {
        _id: Date.now(),
        type: 'HOSPITAL_UPDATE',
        message: `New hospital added: ${hospital.name}`,
        relatedHospital: hospital._id,
        read: false,
        createdAt: new Date()
      };
      setNotifications(prev => [newNotification, ...prev]);
    });

    socket.on('hospital-capacity-update', (hospital) => {
      const newNotification = {
        _id: Date.now(),
        type: 'CAPACITY_ALERT',
        message: `${hospital.name} capacity updated - Available beds: ${hospital.availableBeds}`,
        relatedHospital: hospital._id,
        read: false,
        createdAt: new Date()
      };
      setNotifications(prev => [newNotification, ...prev]);
    });

    socket.on('hospital-status-change', (update) => {
      const newNotification = {
        _id: Date.now(),
        type: 'HOSPITAL_UPDATE',
        message: `${update.hospital.name} status changed to ${update.status}`,
        relatedHospital: update.hospitalId,
        read: false,
        createdAt: new Date()
      };
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      socket.off('new-emergency');
      socket.off('new-hospital-added');
      socket.off('hospital-capacity-update');
      socket.off('hospital-status-change');
    };
  }, []);

  const markAsRead = async (notificationId) => {
    try {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 right-0 left-0 bg-white shadow-sm border-b border-gray-200 px-4 py-3 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div 
            className={`
              transition-all duration-300 ease-in-out
              ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}
              ml-2
            `}
          >
            <h1 className="text-xl font-bold text-gray-900">
              Healthcare Routing System
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">No notifications</p>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification._id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markAsRead(notification._id)}
                      >
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}