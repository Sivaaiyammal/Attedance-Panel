import { AttendanceRecord, CheckInOutEntry, UserStats } from '../types';
import { apiService } from '../services/api';

// These functions now use the API service instead of localStorage
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  try {
    return await apiService.getAttendanceRecords();
  } catch (error) {
    console.error('Failed to get attendance records:', error);
    return [];
  }
};

export const getTodaysRecord = async (userId: string): Promise<AttendanceRecord | null> => {
  try {
    return await apiService.getTodaysRecord();
  } catch (error) {
    console.error('Failed to get today\'s record:', error);
    return null;
  }
};

export const addCheckInOutEntry = async (
  userId: string, 
  userName: string, 
  type: 'check-in' | 'check-out', 
  location: any
): Promise<AttendanceRecord> => {
  try {
    return await apiService.addCheckInOut(type, location);
  } catch (error) {
    console.error('Failed to add check-in/out entry:', error);
    throw error;
  }
};

export const calculateUserStats = async (userId: string): Promise<UserStats> => {
  try {
    return await apiService.getUserStats(userId);
  } catch (error) {
    console.error('Failed to calculate user stats:', error);
    return {
      totalWorkingDays: 0,
      totalLeaveDays: 0,
      totalWorkingHours: 0,
      monthlyHours: 0,
      averageHoursPerDay: 0,
      currentMonthWorkingDays: 0,
      currentMonthLeaveDays: 0
    };
  }
};

// Keep these utility functions as they are still needed for client-side calculations
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