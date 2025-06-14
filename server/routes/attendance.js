import express from 'express';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Party from '../models/Party.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all attendance records (admin) or user's records
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show user's own records
    if (req.user.role !== 'admin') {
      query.userId = req.user.userId;
    }

    const records = await AttendanceRecord.find(query)
      .populate('userId', 'name email')
      .populate('entries.partyId', 'name')
      .populate('sessions.partyId', 'name')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's record for current user
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const record = await AttendanceRecord.findOne({
      userId: req.user.userId,
      date: today
    }).populate('entries.partyId', 'name')
      .populate('sessions.partyId', 'name');

    res.json(record);
  } catch (error) {
    console.error('Get today record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add check-in/check-out entry
router.post('/checkin-checkout', authenticateToken, async (req, res) => {
  try {
    const { type, location, partyId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date();

    // Validate party for check-in
    let party = null;
    if (type === 'check-in') {
      if (!partyId) {
        return res.status(400).json({ message: 'Party selection is required for check-in' });
      }

      party = await Party.findById(partyId);
      if (!party || !party.isActive) {
        return res.status(400).json({ message: 'Invalid party selected' });
      }
    }

    // Find or create today's record
    let record = await AttendanceRecord.findOne({
      userId: req.user.userId,
      date: today
    });

    if (!record) {
      record = new AttendanceRecord({
        userId: req.user.userId,
        userName: req.user.name || 'Unknown User',
        date: today,
        entries: []
      });
    }

    // Add new entry
    const newEntry = {
      timestamp,
      type,
      location
    };

    // Add party info for check-in
    if (type === 'check-in' && party) {
      newEntry.partyId = party._id;
      newEntry.partyName = party.name;
    }

    record.entries.push(newEntry);

    // Calculate sessions and total hours
    const sessions = calculateSessions(record.entries);
    record.sessions = sessions;
    record.totalHours = sessions.reduce((total, session) => total + session.hours, 0);

    await record.save();

    // Populate party data before sending response
    await record.populate('entries.partyId', 'name');
    await record.populate('sessions.partyId', 'name');

    res.json(record);
  } catch (error) {
    console.error('Check-in/out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics
router.get('/stats/:userId?', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    
    // If not admin and trying to access other user's stats
    if (req.user.role !== 'admin' && userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const records = await AttendanceRecord.find({ userId });
    const stats = calculateUserStats(records);

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate sessions
function calculateSessions(entries) {
  const sessions = [];
  const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  let currentCheckIn = null;
  
  for (const entry of sortedEntries) {
    if (entry.type === 'check-in') {
      currentCheckIn = entry;
    } else if (entry.type === 'check-out' && currentCheckIn) {
      const hours = calculateHours(currentCheckIn.timestamp, entry.timestamp);
      sessions.push({
        checkIn: currentCheckIn.timestamp,
        checkOut: entry.timestamp,
        hours,
        partyId: currentCheckIn.partyId,
        partyName: currentCheckIn.partyName
      });
      currentCheckIn = null;
    }
  }
  
  return sessions;
}

// Helper function to calculate hours between two timestamps
function calculateHours(checkIn, checkOut) {
  const checkInTime = new Date(checkIn);
  const checkOutTime = new Date(checkOut);
  const diffMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

// Helper function to calculate user statistics
function calculateUserStats(records) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Calculate total working days (days with at least one check-in)
  const totalWorkingDays = records.filter(r => 
    r.entries && r.entries.some(e => e.type === 'check-in')
  ).length;
  
  // Calculate total working hours
  const totalWorkingHours = records.reduce((total, record) => total + (record.totalHours || 0), 0);
  
  // Calculate monthly stats
  const monthlyRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  
  const currentMonthWorkingDays = monthlyRecords.filter(r => 
    r.entries && r.entries.some(e => e.type === 'check-in')
  ).length;
  
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
}

export default router;