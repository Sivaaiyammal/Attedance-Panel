import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, LogOut, Users, BarChart3, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CheckInOut from './CheckInOut';
import ReportsList from './ReportsList';
import AdminPanel from './AdminPanel';
import logo from '../assets/logo-teeku.webp';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('checkin');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'checkin', label: 'Check In/Out', icon: Clock },
    { id: 'reports', label: 'My Reports', icon: BarChart3 },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: Users }] : [])
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"> */}
                {/* <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-white" /> */}
                
              {/* </div> */}
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Attendance Portal</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Welcome back, {user?.name}</p>
              </div>
            </div>
            
            <img src={logo}  alt="Logo"  className="w-auto  h-auto"/>

            {/* Desktop Header Right */}
            <div className="hidden lg:flex items-center space-x-6">
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(currentTime)}
                </div>
              </div>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <div className="text-right text-xs">
                <div className="font-semibold text-gray-900">
                  {formatTime(currentTime)}
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-2">
                <div className="px-4 py-2 text-sm text-gray-600">
                  Welcome back, {user?.name}
                </div>
                <div className="px-4 py-2 text-sm text-gray-600">
                  {formatDate(currentTime)}
                </div>
                <button
                  onClick={logout}
                  className="mx-4 flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* User Info Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border border-white/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                <span className="text-white text-lg sm:text-xl font-bold">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-sm sm:text-base text-gray-600">{user?.email}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role === 'admin' ? 'System Administrator' : 'Employee'}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-gray-600 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{formatDate(currentTime)}</span>
                <span className="sm:hidden">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Location Tracking Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 sm:space-x-1 mb-6 sm:mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap touch-manipulation ${
                activeTab === tab.id
                  ? 'bg-white shadow-lg text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'checkin' && <CheckInOut />}
          {activeTab === 'reports' && <ReportsList userId={user?.id} />}
          {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;