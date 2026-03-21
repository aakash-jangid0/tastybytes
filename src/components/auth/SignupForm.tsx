import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ValidationError {
  field: string;
  message: string;
}

type SignupMode = 'email' | 'phone' | 'otp';

function SignupForm() {
  const [signupMode, setSignupMode] = useState<SignupMode>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const { signUp, signInWithGoogle, signInWithPhone, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const validateEmailForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    if (!name.trim()) {
      newErrors.push({ field: 'name', message: 'Name is required' });
    }

    if (!email.trim()) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!phone.trim()) {
      newErrors.push({ field: 'phone', message: 'Phone number is required' });
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.push({ field: 'phone', message: 'Please enter a valid 10-digit phone number' });
    }

    if (!password) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    } else if (password.length < 6) {
      newErrors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmailForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, name, phone);
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      await signInWithPhone(formattedPhone);
      setSignupMode('otp');
    } catch (error) {
      console.error('Phone signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      await verifyOtp(formattedPhone, otp);
      navigate('/');
    } catch (error) {
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

      {/* Google Sign Up */}
      <button
        onClick={async () => {
          try {
            await signInWithGoogle();
          } catch (error) {
            console.error('Google signup error:', error);
          }
        }}
        className="w-full flex items-center justify-center gap-3 py-2.5 border-2 border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign up with Google
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Signup Mode Tabs (Email / Phone) */}
      {signupMode !== 'otp' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSignupMode('email')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              signupMode === 'email'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setSignupMode('phone')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              signupMode === 'phone'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Phone OTP
          </button>
        </div>
      )}

      {/* Email Signup Form */}
      {signupMode === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors(errors.filter(error => error.field !== 'name'));
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  getFieldError('name') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
                autoComplete="off"
              />
            </div>
            {getFieldError('name') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('name')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="flex">
              <span className="inline-flex items-center gap-1 px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                <Phone className="w-4 h-4" />
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setErrors(errors.filter(error => error.field !== 'phone'));
                }}
                className={`w-full px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  getFieldError('phone') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter 10-digit number"
                autoComplete="tel"
              />
            </div>
            {getFieldError('phone') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('phone')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(errors.filter(error => error.field !== 'email'));
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  getFieldError('email') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                autoComplete="off"
              />
            </div>
            {getFieldError('email') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('email')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors(errors.filter(error => error.field !== 'password'));
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  getFieldError('password') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password (min. 6 characters)"
                autoComplete="new-password"
              />
            </div>
            {getFieldError('password') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('password')}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
      )}

      {/* Phone Signup Form */}
      {signupMode === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center gap-1 px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                <Phone className="w-4 h-4" />
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter 10-digit number"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || phone.length !== 10}
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* OTP Verification Form */}
      {signupMode === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <button
            type="button"
            onClick={() => setSignupMode('phone')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Change number
          </button>
          <p className="text-sm text-gray-600">
            OTP sent to <span className="font-medium">+91{phone}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg tracking-widest"
              placeholder="------"
              maxLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify & Create Account'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOtp('');
              handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
            }}
            disabled={isLoading}
            className="w-full text-sm text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50"
          >
            Resend OTP
          </button>
        </form>
      )}
    </motion.div>
  );
}

export default SignupForm;
