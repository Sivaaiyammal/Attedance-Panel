export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  name: string;
  email: string;
}

export interface Party {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CheckInOutEntry {
  id: string;
  timestamp: string;
  type: 'check-in' | 'check-out';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  partyId?: string;
  partyName?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  entries: CheckInOutEntry[];
  totalHours?: number;
  sessions?: {
    checkIn: string;
    checkOut: string;
    hours: number;
    partyId: string;
    partyName: string;
  }[];
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface UserStats {
  totalWorkingDays: number;
  totalLeaveDays: number;
  totalWorkingHours: number;
  monthlyHours: number;
  averageHoursPerDay: number;
  currentMonthWorkingDays: number;
  currentMonthLeaveDays: number;
}