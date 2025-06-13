import React, { useState, useEffect } from 'react';
import { Users, BarChart3, Download, Calendar, Clock, MapPin, TrendingUp, Filter, UserCheck, UserX } from 'lucide-react';
import { getAttendanceRecords, calculateUserStats } from '../utils/attendance';
import { AttendanceRecord, UserStats } from '../types';
import ReportsList from './ReportsList';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allUserStats, setAllUserStats] = useState<{[userId: string]: UserStats}>({});
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayPresent: 0,
    todayAbsent: 0,
    avgHoursPerDay: 0,
    totalHoursThisMonth: 0,
    totalWorkingDays: 0,
    totalLeaveDays: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allRecords = getAttendanceRecords();
    setRecords(allRecords);

    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const todayRecords = allRecords.filter(record => record.date === today);
    const monthlyRecords = allRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const uniqueEmployees = new Set(allRecords.map(record => record.userId));
    const presentToday = todayRecords.filter(record => record.entries.some(e => e.type === 'check-in')).length;
    const totalEmployees = uniqueEmployees.size;
    
    const totalHoursThisMonth = monthlyRecords.reduce((sum, record) => {
      return sum + (record.totalHours || 0);
    }, 0);

    const completedRecords = allRecords.filter(record => record.totalHours && record.totalHours > 0);
    const avgHoursPerDay = completedRecords.length > 0 
      ? completedRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0) / completedRecords.length
      : 0;

    // Calculate user stats for all users
    const userStatsMap: {[userId: string]: UserStats} = {};
    let totalWorkingDays = 0;
    let totalLeaveDays = 0;

    uniqueEmployees.forEach(userId => {
      const userStats = calculateUserStats(userId);
      userStatsMap[userId] = userStats;
      totalWorkingDays += userStats.totalWorkingDays;
      totalLeaveDays += userStats.totalLeaveDays;
    });

    setAllUserStats(userStatsMap);

    setStats({
      totalEmployees,
      todayPresent: presentToday,
      todayAbsent: Math.max(0, totalEmployees - presentToday),
      avgHoursPerDay,
      totalHoursThisMonth,
      totalWorkingDays,
      totalLeaveDays
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'reports', label: 'All Reports', icon: Users }
  ];

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${color} truncate`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const TodayActivity: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(record => record.date === today);

    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Today's Activity</h3>
        
        {todayRecords.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No activity recorded today</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {todayRecords.map((record) => {
              const lastEntry = record.entries[record.entries.length - 1];
              const isCurrentlyCheckedIn = lastEntry?.type === 'check-in';
              
              return (
                <div key={record.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {record.userName.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{record.userName}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 space-y-1 sm:space-y-0">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{record.entries.length} check-in/out{record.entries.length !== 1 ? 's' : ''}</span>
                        </span>
                        {record.sessions && record.sessions.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <BarChart3 className="w-3 h-3" />
                            <span>{record.sessions.length} session{record.sessions.length !== 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 flex items-center space-x-2">
                    {record.totalHours && record.totalHours > 0 ? (
                      <span className="text-base sm:text-lg font-semibold text-green-600">
                        {record.totalHours.toFixed(1)}h
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">0h</span>
                    )}
                    
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      isCurrentlyCheckedIn
                        ? 'bg-green-100 text-green-800'
                        : record.entries.length > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <span className="hidden sm:inline">
                        {isCurrentlyCheckedIn
                          ? 'Checked In'
                          : record.entries.length > 0
                          ? 'Active'
                          : 'No Activity'
                        }
                      </span>
                      <span className="sm:hidden">
                        {isCurrentlyCheckedIn ? '🟢' : record.entries.length > 0 ? '🔵' : '⚪'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const UserStatsOverview: React.FC = () => {
    const uniqueUsers = Array.from(new Set(records.map(r => r.userId)));
    
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Employee Overview</h3>
        
        {uniqueUsers.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No employee data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uniqueUsers.map((userId) => {
              const userRecords = records.filter(r => r.userId === userId);
              const userName = userRecords[0]?.userName || 'Unknown User';
              const userStats = allUserStats[userId];
              
              return (
                <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {userName.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{userName}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600 space-y-1 sm:space-y-0">
                        {userStats && (
                          <>
                            <span className="flex items-center space-x-1">
                              <UserCheck className="w-3 h-3" />
                              <span>{userStats.totalWorkingDays} working days</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{userStats.totalWorkingHours.toFixed(1)}h total</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    {userStats && (
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {userStats.averageHoursPerDay.toFixed(1)}h/day
                        </div>
                        <div className="text-gray-600">
                          {userStats.monthlyHours.toFixed(1)}h this month
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage and monitor employee attendance</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 sm:space-x-1 mb-6 sm:mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Users}
              color="text-blue-600"
            />
            <StatCard
              title="Present Today"
              value={stats.todayPresent}
              subtitle={`${stats.todayAbsent} absent`}
              icon={UserCheck}
              color="text-green-600"
            />
            <StatCard
              title="Total Working Days"
              value={stats.totalWorkingDays}
              subtitle="All employees"
              icon={Calendar}
              color="text-purple-600"
            />
            <StatCard
              title="Monthly Hours"
              value={stats.totalHoursThisMonth.toFixed(0)}
              subtitle="This month"
              icon={BarChart3}
              color="text-indigo-600"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <StatCard
              title="Avg Hours/Day"
              value={stats.avgHoursPerDay.toFixed(1)}
              subtitle="Per employee"
              icon={Clock}
              color="text-teal-600"
            />
            <StatCard
              title="Total Leave Days"
              value={stats.totalLeaveDays}
              subtitle="All employees"
              icon={UserX}
              color="text-red-600"
            />
            <StatCard
              title="Active Sessions"
              value={records.filter(r => {
                const today = new Date().toISOString().split('T')[0];
                const lastEntry = r.entries[r.entries.length - 1];
                return r.date === today && lastEntry?.type === 'check-in';
              }).length}
              subtitle="Currently checked in"
              icon={TrendingUp}
              color="text-orange-600"
            />
          </div>

          {/* Today's Activity */}
          <TodayActivity />

          {/* User Stats Overview */}
          <UserStatsOverview />
        </div>
      )}

      {activeTab === 'reports' && (
        <ReportsList showAllUsers={true} />
      )}
    </div>
  );
};

export default AdminPanel;