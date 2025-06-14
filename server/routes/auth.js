import express from 'express';
import jwt from 'jsonwebtoken';
import { sendOtpMail } from '../utils/sendOtpMail.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register route (for creating initial users)
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      password,
      name,
      email,
      role: role || 'user'
    });

    await user.save();

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

router.post('/request-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expires = Date.now() + 5 * 60 * 1000; // 5 mins

    user.resetOtp = otp;
    user.resetOtpExpires = expires;
    await user.save();

    await sendOtpMail(email, otp); // You must have nodemailer set up

    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email, isActive: true });

    if (!user || user.resetOtp !== otp || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Optional: clear OTP after successful verification
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, newPassword, otp } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // console.log('OTP received:', otp);
    // console.log('OTP stored:', user.resetOtp);
    // console.log('OTP expires at:', user.resetOtpExpires, 'Current time:', Date.now());

    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 5 * 60 * 1000;
    // console.log('Setting OTP:', user.resetOtp);
    // console.log('Setting Expires:', user.resetOtpExpires);

    await user.save();
    // console.log('After save OTP:', user.resetOtp);


    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: 'OTP does not match' });
    }

    if (user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;