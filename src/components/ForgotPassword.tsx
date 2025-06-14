import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { Mail, Key, Lock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-teeku.webp';   
import { Link } from 'react-router-dom';  

const ForgotPassword: React.FC = () => {
  const { requestOtp, verifyOtp, resetPassword } = useAuth();

  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await requestOtp(email);
      setMessage(res);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const success = await verifyOtp(email, otp);
      if (success) {
        setStep('reset');
      } else {
        setError('Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await resetPassword(email, newPassword, otp);
      setMessage(res);
      setStep('email');
      setEmail('');
      setOtp('');
      setNewPassword('');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
    
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-8  rounded-full">
            <img src={logo} alt="Logo" className="max-w-[auto] max-h-[auto] object-contain" style={{ filter: 'drop-shadow(16px 16px 20px red) invert(120%)'}} />
            </div>

          <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
          <p className="text-blue-100 text-sm">Recover your account with OTP verification</p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium"
            >
              Send OTP
            </button>
            <div className='text-center'>
                <Link to="/" className="text-sm text-blue-200 hover:text-blue-100 block mt-2">
                Back to Login
                </Link>
            </div>
            
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-medium"
            >
              Verify OTP
            </button>
            <div className='text-center'>
                <Link to="/" className="text-sm text-blue-200 hover:text-blue-100 block mt-2">
                Back to Login
                </Link>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium"
            >
              Reset Password
            </button>
            <div className='text-center'>
                <Link to="/" className="text-sm text-blue-200 hover:text-blue-100 block mt-2">
                Back to Login
                </Link>
            </div>
          </form>
        )}

        {(message || error) && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex items-center space-x-2 ${
            error ? 'text-red-300 bg-red-500/10' : 'text-green-300 bg-green-500/10'
          }`}>
            <AlertCircle className="w-5 h-5" />
            <span>{error || message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
