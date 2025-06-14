import mongoose from 'mongoose';

const checkInOutEntrySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['check-in', 'check-out'],
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: ''
    }
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: function() {
      return this.type === 'check-in';
    }
  },
  partyName: {
    type: String,
    required: function() {
      return this.type === 'check-in';
    }
  }
});

const sessionSchema = new mongoose.Schema({
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  hours: {
    type: Number,
    required: true
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  partyName: {
    type: String,
    required: true
  }
});

const attendanceRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  entries: [checkInOutEntrySchema],
  sessions: [sessionSchema],
  totalHours: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create compound index for userId and date
attendanceRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('AttendanceRecord', attendanceRecordSchema);