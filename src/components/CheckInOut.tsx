import React, { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, XCircle, Loader2, AlertCircle, Play, Square, BarChart3, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation } from '../utils/geolocation';
import { 
  getTodaysRecord, 
  addCheckInOutEntry,
  getCurrentStatus,
  formatTime,
  calculateUserStats
} from '../utils/attendance';
import { AttendanceRecord, Location, UserStats } from '../types';

const CheckInOut: React.FC = () => {
  const { user } = useAuth();
  const [todaysRecord, setTodaysRecord] = useState<AttendanceRecord | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadTodaysRecord();
      loadUserStats();
    }
  }, [user]);

  const loadTodaysRecord = async () => {
    if (user) {
      try {
        const record = await getTodaysRecord(user.id);
        setTodaysRecord(record);
      } catch (error) {
        console.error('Failed to load today\'s record:', error);
      }
    }
  };

  const loadUserStats = async () => {
    if (user) {
      try {
        const stats = await calculateUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to load user stats:', error);
      }
    }
  };

  const getLocationAndUpdateState = async () => {
    setLocationLoading(true);
    setError('');
    
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      return location;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Location access denied';
      setError(errorMessage);
      throw error;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const location = await getLocationAndUpdateState();
      const updatedRecord = await addCheckInOutEntry(user.id, user.name, 'check-in', location);
      setTodaysRecord(updatedRecord);
      await loadUserStats();
    } catch (error) {
      console.error('Check-in failed:', error);
      setError('Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const location = await getLocationAndUpdateState();
      const updatedRecord = await addCheckInOutEntry(user.id, user.name, 'check-out', location);
      setTodaysRecord(updatedRecord);
      await loadUserStats();
    } catch (error) {
      console.error('Check-out failed:', error);
      setError('Failed to check out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatus = getCurrentStatus(todaysRecord);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
  }> = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-600 truncate">{title}</p>
          <p className={`text-lg font-bold ${color} truncate`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* User Statistics Overview */}
      {userStats && (
        <div className="mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard
              title="Working Days"
              value={userStats.totalWorkingDays}
              icon={Calendar}
              color="text-blue-600"
            />
            <StatCard
              title="Leave Days"
              value={userStats.totalLeaveDays}
              icon={XCircle}
              color="text-red-600"
            />
            <StatCard
              title="Total Hours"
              value={userStats.totalWorkingHours.toFixed(1)}
              subtitle="All time"
              icon={Clock}
              color="text-green-600"
            />
            <StatCard
              title="Monthly Hours"
              value={userStats.monthlyHours.toFixed(1)}
              subtitle="This month"
              icon={BarChart3}
              color="text-purple-600"
            />
            <StatCard
              title="Avg Hours/Day"
              value={userStats.averageHoursPerDay.toFixed(1)}
              icon={Clock}
              color="text-indigo-600"
            />
            <StatCard
              title="Month Days"
              value={`${userStats.currentMonthWorkingDays}/${userStats.currentMonthWorkingDays + userStats.currentMonthLeaveDays}`}
              subtitle="Work/Total"
              icon={Calendar}
              color="text-teal-600"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Check In/Out Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-white/20">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Attendance Tracker
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            
            {/* Current Status */}
            <div className="mt-4">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                currentStatus === 'checked-in' 
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : currentStatus === 'checked-out'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {currentStatus === 'checked-in' && <Play className="w-4 h-4" />}
                {currentStatus === 'checked-out' && <Square className="w-4 h-4" />}
                {currentStatus === 'not-started' && <Clock className="w-4 h-4" />}
                <span>
                  {currentStatus === 'checked-in' && 'Currently Checked In'}
                  {currentStatus === 'checked-out' && 'Ready for Next Session'}
                  {currentStatus === 'not-started' && 'Ready to Start'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {currentStatus !== 'checked-in' && (
              <button
                onClick={handleCheckIn}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-4 px-6 rounded-xl font-semibold text-base sm:text-lg hover:from-emerald-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
                <span>{isLoading ? 'Checking In...' : 'Check In'}</span>
              </button>
            )}

            {currentStatus === 'checked-in' && (
              <button
                onClick={handleCheckOut}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold text-base sm:text-lg hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
                <span>{isLoading ? 'Checking Out...' : 'Check Out'}</span>
              </button>
            )}
          </div>

          {locationLoading && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Getting your location...</span>
            </div>
          )}
        </div>

        {/* Today's Summary Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-white/20">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Today's Activity</h3>
          
          {todaysRecord && todaysRecord.entries.length > 0 ? (
            <div className="space-y-4">
              {/* Sessions Summary */}
              {todaysRecord.sessions && todaysRecord.sessions.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-800">Total Hours Today</span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">
                      {todaysRecord.totalHours?.toFixed(1)}h
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    {todaysRecord.sessions.length} session{todaysRecord.sessions.length !== 1 ? 's' : ''} completed
                  </p>
                </div>
              )}

              {/* All Entries */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">All Check-ins & Check-outs</h4>
                {todaysRecord.entries.map((entry, index) => (
                  <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    entry.type === 'check-in' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.type === 'check-in' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {entry.type === 'check-in' ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          entry.type === 'check-in' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {entry.type === 'check-in' ? 'Check In' : 'Check Out'}
                        </p>
                        <p className={`text-sm ${
                          entry.type === 'check-in' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center space-x-1 ${
                        entry.type === 'check-in' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs hidden sm:inline">Location recorded</span>
                        <span className="text-xs sm:hidden">✓</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completed Sessions */}
              {todaysRecord.sessions && todaysRecord.sessions.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Completed Sessions</h4>
                  <div className="space-y-2">
                    {todaysRecord.sessions.map((session, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-gray-600">
                              {formatTime(session.checkIn)} - {formatTime(session.checkOut)}
                            </span>
                          </div>
                          <div className="font-semibold text-gray-900">
                            {session.hours.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentLocation && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800">Current Location</p>
                      <p className="text-sm text-gray-600 mt-1 break-words">
                        {currentLocation.address}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activity recorded today</p>
              <p className="text-sm text-gray-400 mt-2">
                Click the check-in button to start tracking your time
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInOut;