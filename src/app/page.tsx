'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { CustomTextInput, CustomNumberInput, CustomSelect } from '@/components/CustomInput';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    department: 'meter',
    role: 'admin',
    verificationCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordCode, setForgotPasswordCode] = useState('');
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code' | 'reset'>('email');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const { login, register, user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  const validatePassword = (password: string): string | null => {
    if (!password.trim()) {
      return 'Password is required';
    }
    
    if (password.length < 6 || password.length > 10) {
      return 'Password must be between 6 and 10 characters';
    }
    
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least one symbol';
    }
    
    return null;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      errors.password = passwordError;
    }

    if (!isLogin) {
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }

      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Email is invalid';
      }

      if (!formData.employeeId.trim()) {
        errors.employeeId = 'Employee ID is required';
      }

      // Require email verification for registration
      if (!emailVerified) {
        errors.email = 'Please verify your email address first';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      await authAPI.sendVerificationCode(formData.email, 'registration');
      setVerificationCodeSent(true);
      setError('');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send verification code';
      // Provide more helpful error message
      if (errorMessage.includes('Email service not configured') || errorMessage.includes('email configuration')) {
        setError('Email service is not configured. Please add EMAIL_USER and EMAIL_PASS to your backend .env file. See EMAIL_SETUP.md for instructions.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.verifyCode(formData.email, formData.verificationCode, 'registration');
      setEmailVerified(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        // Include verification code in registration
        await register({
          ...formData,
          verificationCode: formData.verificationCode,
        });
      }
    } catch (err: any) {
      setError(err.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim() || !/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const response = await authAPI.forgotPassword(forgotPasswordEmail);
      // If email was sent successfully, proceed to code step
      if (response?.sent || response?.message) {
        setForgotPasswordStep('code');
        setError('');
        // Show success message
        alert('Verification code sent! Please check your email.');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      // Handle different error types
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send password reset code';
      
      console.error('Forgot password error:', err);
      
      // Check if it's an email configuration error
      if (errorMessage.includes('not configured') || 
          errorMessage.includes('configuration is missing') ||
          errorMessage.includes('EMAIL_USER') ||
          errorMessage.includes('EMAIL_PASS')) {
        setError('Email service is not configured on the server. Please contact the administrator to configure email settings.');
      } else if (errorMessage.includes('authentication failed') || 
                 errorMessage.includes('Invalid login')) {
        setError('Email authentication failed. Please contact the administrator to check email credentials.');
      } else if (errorMessage.includes('connection') || 
                 errorMessage.includes('connect') ||
                 errorMessage.includes('ECONNREFUSED') ||
                 errorMessage.includes('ETIMEDOUT')) {
        setError('Cannot connect to email server. Please try again later or contact the administrator.');
      } else if (errorMessage.includes('EMAIL_SEND_FAILED')) {
        setError('Failed to send email. Please contact the administrator.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyPasswordResetCode = async () => {
    if (!forgotPasswordCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.verifyCode(forgotPasswordEmail, forgotPasswordCode, 'password_reset');
      setForgotPasswordStep('reset');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const passwordError = validatePassword(forgotPasswordNewPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.resetPassword(forgotPasswordEmail, forgotPasswordCode, forgotPasswordNewPassword);
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
      setForgotPasswordCode('');
      setForgotPasswordNewPassword('');
      setForgotPasswordStep('email');
      setError('');
      alert('Password reset successfully! Please login with your new password.');
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      employeeId: '',
      department: 'meter',
      role: 'admin',
      verificationCode: '',
    });
    setError('');
    setValidationErrors({});
    setEmailVerified(false);
    setVerificationCodeSent(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MeterMate Admin
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>
        
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <CustomTextInput
                id="username"
                name="username"
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                error={validationErrors.username}
              />
              <div>
                <CustomTextInput
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  error={validationErrors.password}
                  showPasswordToggle={true}
                  isPasswordVisible={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
                {!isLogin && formData.password && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p className="font-medium mb-1">Password requirements:</p>
                    <ul className="space-y-0.5 ml-4">
                      <li className={formData.password.length >= 6 && formData.password.length <= 10 ? 'text-green-600' : 'text-gray-400'}>
                        • 6-10 characters
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                        • One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                        • One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                        • One number
                      </li>
                      <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                        • One symbol
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

          {!isLogin && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <CustomTextInput
                  id="firstName"
                  name="firstName"
                  type="text"
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  error={validationErrors.firstName}
                />
                <CustomTextInput
                  id="lastName"
                  name="lastName"
                  type="text"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  error={validationErrors.lastName}
                />
              </div>
              
              <div>
                <CustomTextInput
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setEmailVerified(false);
                    setVerificationCodeSent(false);
                  }}
                  required
                  error={validationErrors.email}
                />
                {formData.email && /\S+@\S+\.\S+/.test(formData.email) && !emailVerified && (
                  <div className="mt-2 space-y-2">
                    {!verificationCodeSent ? (
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={sendingCode}
                        className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sendingCode ? 'Sending...' : 'Send Verification Code'}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <CustomTextInput
                          id="verificationCode"
                          name="verificationCode"
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={formData.verificationCode}
                          onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          maxLength={6}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={loading || formData.verificationCode.length !== 6}
                            className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {loading ? 'Verifying...' : 'Verify Code'}
                          </button>
                          <button
                            type="button"
                            onClick={handleSendVerificationCode}
                            disabled={sendingCode}
                            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                          >
                            Resend
                          </button>
                        </div>
                        {emailVerified && (
                          <div className="text-sm text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Email verified
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <CustomTextInput
                id="phone"
                name="phone"
                type="tel"
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              
              <CustomTextInput
                id="employeeId"
                name="employeeId"
                type="text"
                label="Employee ID"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
                error={validationErrors.employeeId}
              />
              
              <CustomSelect
                id="department"
                name="department"
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                options={[
                  { value: 'meter', label: 'Meter Department' },
                  { value: 'admin', label: 'Admin Department' }
                ]}
              />
              
              <CustomSelect
                id="role"
                name="role"
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'meter_reader', label: 'Meter Reader' },
                  { value: 'admin', label: 'Job Assigner (Admin)' }
                ]}
              />
            </div>
          )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || (!isLogin && !emailVerified)}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    {isLogin ? 'Sign in' : 'Create Account'}
                    <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </div>

            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordEmail('');
                setForgotPasswordCode('');
                setForgotPasswordNewPassword('');
                setForgotPasswordStep('email');
                setError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">Reset Password</h3>

            {forgotPasswordStep === 'email' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Enter your email address and we'll send you a verification code.</p>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
                <CustomTextInput
                  id="forgotPasswordEmail"
                  name="forgotPasswordEmail"
                  type="email"
                  label="Email"
                  value={forgotPasswordEmail}
                  onChange={(e) => {
                    setForgotPasswordEmail(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingCode || !forgotPasswordEmail || !/\S+@\S+\.\S+/.test(forgotPasswordEmail)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingCode ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {forgotPasswordStep === 'code' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Enter the verification code sent to {forgotPasswordEmail}</p>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
                <CustomTextInput
                  id="forgotPasswordCode"
                  name="forgotPasswordCode"
                  type="text"
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={forgotPasswordCode}
                  onChange={(e) => {
                    setForgotPasswordCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError(''); // Clear error when user types
                  }}
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyPasswordResetCode}
                    disabled={loading || forgotPasswordCode.length !== 6}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={sendingCode}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingCode ? 'Resending...' : 'Resend'}
                  </button>
                </div>
              </div>
            )}

            {forgotPasswordStep === 'reset' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Enter your new password</p>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
                <CustomTextInput
                  id="forgotPasswordNewPassword"
                  name="forgotPasswordNewPassword"
                  type="password"
                  label="New Password"
                  value={forgotPasswordNewPassword}
                  onChange={(e) => {
                    setForgotPasswordNewPassword(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  required
                />
                {forgotPasswordNewPassword && (
                  <div className="text-xs text-gray-500">
                    <p className="font-medium mb-1">Password requirements:</p>
                    <ul className="space-y-0.5 ml-4">
                      <li className={forgotPasswordNewPassword.length >= 6 && forgotPasswordNewPassword.length <= 10 ? 'text-green-600' : 'text-gray-400'}>
                        • 6-10 characters
                      </li>
                      <li className={/[A-Z]/.test(forgotPasswordNewPassword) ? 'text-green-600' : 'text-gray-400'}>
                        • One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(forgotPasswordNewPassword) ? 'text-green-600' : 'text-gray-400'}>
                        • One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(forgotPasswordNewPassword) ? 'text-green-600' : 'text-gray-400'}>
                        • One number
                      </li>
                      <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(forgotPasswordNewPassword) ? 'text-green-600' : 'text-gray-400'}>
                        • One symbol
                      </li>
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
