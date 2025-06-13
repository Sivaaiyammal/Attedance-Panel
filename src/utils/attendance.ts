import { AttendanceRecord, CheckInOutEntry, UserStats } from '../types';

export const getAttendanceRecords = (): AttendanceRecord[] => {
  const records = localStorage.getItem('attendanceRecords');
  return records ? JSON.parse(records) : [];
};

export const saveAttendanceRecord = (record: AttendanceRecord): void => {
  const records = getAttendanceRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);
  
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  
  localStorage.setItem('attendanceRecords', JSON.stringify(records));
};

export const getTodaysRecord = (userId: string): AttendanceRecord | null => {
  const today = new Date().toISOString().split('T')[0];
  const records = getAttendanceRecords();
  return records.find(r => r.userId === userId && r.date === today) || null;
};

export const addCheckInOutEntry = (userId: string, userName: string, type: 'check-in' | 'check-out', location: any): AttendanceRecord => {
  const today = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();
  
  let record = getTodaysRecord(userId);
  
  if (!record) {
    record = {
      id: `${userId}-${today}`,
      userId,
      userName,
      date: today,
      entries: []
    };
  }
  
  const newEntry: CheckInOutEntry = {
    id: `${record.id}-${Date.now()}`,
    timestamp,
    type,
    location
  };
  
  record.entries.push(newEntry);
  
  // Calculate sessions and total hours
  const sessions = calculateSessions(record.entries);
  record.sessions = sessions;
  record.totalHours = sessions.reduce((total, session) => total + session.hours, 0);
  
  saveAttendanceRecord(record);
  return record;
};

export const calculateSessions = (entries: CheckInOutEntry[]) => {
  const sessions: { checkIn: string; checkOut: string; hours: number }[] = [];
  const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  let currentCheckIn: CheckInOutEntry | null = null;
  
  for (const entry of sortedEntries) {
    if (entry.type === 'check-in') {
      currentCheckIn = entry;
    } else if (entry.type === 'check-out' && currentCheckIn) {
      const hours = calculateHours(currentCheckIn.timestamp, entry.timestamp);
      sessions.push({
        checkIn: currentCheckIn.timestamp,
        checkOut: entry.timestamp,
        hours
      });
      currentCheckIn = null;
    }
  }
  
  return sessions;
};

export const getCurrentStatus = (record: AttendanceRecord | null): 'checked-out' | 'checked-in' | 'not-started' => {
  if (!record || record.entries.length === 0) {
    return 'not-started';
  }
  
  const lastEntry = record.entries[record.entries.length - 1];
  return lastEntry.type === 'check-in' ? 'checked-in' : 'checked-out';
};

export const calculateHours = (checkIn: string, checkOut: string): number => {
  const checkInTime = new Date(checkIn);
  const checkOutTime = new Date(checkOut);
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

export const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const calculateUserStats = (userId: string): UserStats => {
  const records = getAttendanceRecords().filter(r => r.userId === userId);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Calculate total working days (days with at least one check-in)
  const totalWorkingDays = records.filter(r => (r.entries || []).some(e => e.type === 'check-in')).length;
  
  // Calculate total working hours
  const totalWorkingHours = records.reduce((total, record) => total + (record.totalHours || 0), 0);
  
  // Calculate monthly stats
  const monthlyRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  
  const currentMonthWorkingDays = monthlyRecords.filter(r => (r.entries || []).some(e => e.type === 'check-in')).length;
  const monthlyHours = monthlyRecords.reduce((total, record) => total + (record.totalHours || 0), 0);
  
  // Calculate leave days (approximate - days in current month without attendance)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDayOfMonth = currentDate.getDate();
  const workingDaysInMonth = Math.min(currentDayOfMonth, daysInMonth);
  const currentMonthLeaveDays = Math.max(0, workingDaysInMonth - currentMonthWorkingDays);
  
  // Estimate total leave days (rough calculation)
  const totalDaysTracked = records.length > 0 ? 
    Math.ceil((new Date().getTime() - new Date(records[0].date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const totalLeaveDays = Math.max(0, totalDaysTracked - totalWorkingDays);
  
  const averageHoursPerDay = totalWorkingDays > 0 ? totalWorkingHours / totalWorkingDays : 0;
  
  return {
    totalWorkingDays,
    totalLeaveDays,
    totalWorkingHours,
    monthlyHours,
    averageHoursPerDay,
    currentMonthWorkingDays,
    currentMonthLeaveDays
  };
};