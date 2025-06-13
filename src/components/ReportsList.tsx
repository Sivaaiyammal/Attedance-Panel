import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Filter, Download, ChevronDown, ChevronUp, Search, Play, Square } from 'lucide-react';
import { getAttendanceRecords, formatTime, formatDate } from '../utils/attendance';
import { AttendanceRecord } from '../types';

interface ReportsListProps {
  userId?: string;
  showAllUsers?: boolean;
}

const ReportsList: React.FC<ReportsListProps> = ({ userId, showAllUsers = false }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [filter, setFilter] = useState('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [userId, showAllUsers]);

  useEffect(() => {
    filterRecords();
  }, [records, filter, dateRange]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      let allRecords = await getAttendanceRecords();
      
      // Sort by date (newest first)
      allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setRecords(allRecords);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(record => record.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(record => record.date <= dateRange.end);
    }

    // Status filter
    if (filter === 'complete') {
      filtered = filtered.filter(record => record.sessions && record.sessions.length > 0);
    } else if (filter === 'incomplete') {
      filtered = filtered.filter(record => {
        const lastEntry = record.entries[record.entries.length - 1];
        return record.entries.length > 0 && (!record.sessions || record.sessions.length === 0 || lastEntry?.type === 'check-in');
      });
    }

    setFilteredRecords(filtered);
  };

  const getStatusColor = (record: AttendanceRecord) => {
    if (record.sessions && record.sessions.length > 0) {
      const lastEntry = record.entries[record.entries.length - 1];
      if (lastEntry?.type === 'check-in') {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      }
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (record.entries.length > 0) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (record: AttendanceRecord) => {
    if (record.sessions && record.sessions.length > 0) {
      const lastEntry = record.entries[record.entries.length - 1];
      if (lastEntry?.type === 'check-in') {
        return 'In Progress';
      }
      return `${record.sessions.length} Session${record.sessions.length !== 1 ? 's' : ''}`;
    } else if (record.entries.length > 0) {
      return 'Incomplete';
    }
    return 'No Data';
  };

  const totalHours = filteredRecords.reduce((sum, record) => {
    return sum + (record.totalHours || 0);
  }, 0);

  const exportData = () => {
    const csvContent = [
      ['Date', 'Employee', 'Total Hours', 'Sessions', 'All Check-ins/Check-outs', 'Locations'],
      ...filteredRecords.map(record => [
        formatDate(record.date),
        record.userName,
        record.totalHours?.toString() || '0',
        record.sessions?.length.toString() || '0',
        record.entries.map(entry => `${entry.type}: ${formatTime(entry.timestamp)}`).join('; '),
        record.entries.map(entry => entry.location.address || 'N/A').join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {showAllUsers ? 'All Employee Reports' : 'My Attendance Reports'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {filteredRecords.length} records found • Total hours: {totalHours.toFixed(1)}h
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 sm:hidden"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={exportData}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg border border-white/20 ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            >
              <option value="all">All Records</option>
              <option value="complete">Complete Sessions</option>
              <option value="incomplete">Incomplete/In Progress</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter('all');
                setDateRange({ start: '', end: '' });
                setShowFilters(false);
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-white/20">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg">No attendance records found</p>
            <p className="text-sm text-gray-400 mt-2">Records will appear here once you start checking in</p>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record._id || record.id} className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {formatDate(record.date)}
                      </h3>
                      {showAllUsers && (
                        <p className="text-sm text-gray-600 truncate">{record.userName}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">
                            {record.entries.length} check-in/out{record.entries.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {record.sessions && record.sessions.length > 0 && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm">
                              {record.sessions.length} session{record.sessions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                    {record.totalHours && record.totalHours > 0 && (
                      <div className="text-right hidden sm:block">
                        <div className="text-lg font-semibold text-gray-900">
                          {record.totalHours.toFixed(1)}h
                        </div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    )}
                    
                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(record)}`}>
                      <span className="hidden sm:inline">{getStatusText(record)}</span>
                      <span className="sm:hidden">
                        {record.sessions && record.sessions.length > 0 ? 
                          (record.entries[record.entries.length - 1]?.type === 'check-in' ? '⏳' : '✓') 
                          : record.entries.length > 0 ? '⏳' : '—'
                        }
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setExpandedRecord(
                        expandedRecord === (record._id || record.id) ? null : (record._id || record.id)
                      )}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 touch-manipulation"
                    >
                      {expandedRecord === (record._id || record.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Total Hours */}
                {record.totalHours && record.totalHours > 0 && (
                  <div className="mt-3 sm:hidden">
                    <div className="text-center bg-blue-50 rounded-lg p-2">
                      <span className="text-lg font-semibold text-blue-600">{record.totalHours.toFixed(1)}h</span>
                      <span className="text-sm text-blue-500 ml-2">Total</span>
                    </div>
                  </div>
                )}
              </div>
              
              {expandedRecord === (record._id || record.id) && (
                <div className="border-t border-gray-200 bg-gray-50/50 p-4 sm:p-6">
                  <div className="space-y-6">
                    {/* All Entries */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">All Check-ins & Check-outs</h4>
                      <div className="space-y-2">
                        {record.entries.map((entry, index) => (
                          <div key={entry._id || entry.id || index} className={`p-3 rounded-lg border ${
                            entry.type === 'check-in' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  entry.type === 'check-in' ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                  {entry.type === 'check-in' ? (
                                    <Play className="w-3 h-3 text-white" />
                                  ) : (
                                    <Square className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <span className={`font-medium ${
                                    entry.type === 'check-in' ? 'text-green-800' : 'text-red-800'
                                  }`}>
                                    {entry.type === 'check-in' ? 'Check In' : 'Check Out'}
                                  </span>
                                  <p className="text-sm text-gray-600">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <MapPin className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="mt-2 text-sm text-gray-600 break-words">
                              {entry.location.address}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Completed Sessions */}
                    {record.sessions && record.sessions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Completed Sessions</h4>
                        <div className="space-y-2">
                          {record.sessions.map((session, index) => (
                            <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  <span className="font-medium text-blue-800">Session {index + 1}</span>
                                  <p className="text-blue-600">
                                    {formatTime(session.checkIn)} - {formatTime(session.checkOut)}
                                  </p>
                                </div>
                                <div className="font-semibold text-blue-800">
                                  {session.hours.toFixed(1)}h
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsList;