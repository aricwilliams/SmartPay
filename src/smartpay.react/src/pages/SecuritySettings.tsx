import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  KeyIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { securityApi, UserSession, SecurityEvent, TwoFactorSetup } from '../services/securityApi';
import { formatRelativeTime } from '../utils/formatting';
import toast from 'react-hot-toast';

export const SecuritySettings: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      const [sessionsData, eventsData] = await Promise.all([
        securityApi.getUserSessions(),
        securityApi.getSecurityEvents(1, 10)
      ]);
      setSessions(sessionsData);
      setSecurityEvents(eventsData);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    setIsSubmitting(true);
    try {
      const result = await securityApi.enableTwoFactor('user@example.com');
      setTwoFactorSetup(result);
      toast.success('Two-factor authentication setup initiated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to enable 2FA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!verificationToken) {
      toast.error('Please enter verification code');
      return;
    }

    setIsSubmitting(true);
    try {
      await securityApi.verifyTwoFactor(verificationToken);
      setIsTwoFactorModalOpen(false);
      setTwoFactorSetup(null);
      setVerificationToken('');
      toast.success('Two-factor authentication enabled successfully!');
      await loadSecurityData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await securityApi.revokeSession(sessionId);
      toast.success('Session revoked successfully');
      await loadSecurityData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await securityApi.revokeAllSessions();
      toast.success('All sessions revoked successfully');
      await loadSecurityData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke sessions');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await securityApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.toLowerCase().includes('mobile')) {
      return <DevicePhoneMobileIcon className="w-5 h-5" />;
    }
    return <ComputerDesktopIcon className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <Badge variant="info">Protected Account</Badge>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-green-100">
                <ShieldCheckIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Secure</p>
                <p className="text-sm text-gray-600">Account Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-blue-100">
                <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                <p className="text-sm text-gray-600">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-purple-100">
                <EyeIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{securityEvents.length}</p>
                <p className="text-sm text-gray-600">Recent Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Authentication</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTwoFactorModalOpen(true)}
              >
                Enable
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <KeyIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600">Change your password</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRevokeAllSessions}
              >
                Revoke All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getDeviceIcon(session.userAgent)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">
                        {session.deviceId || 'Unknown Device'}
                      </p>
                      {session.isCurrent && (
                        <Badge variant="success" size="sm">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {session.ipAddress} • {formatRelativeTime(session.lastAccessedAt)}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRevokeSession(session.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <ClockIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{event.eventType}</p>
                    <p className="text-sm text-gray-600">
                      {event.ipAddress} • {event.location} • {formatRelativeTime(event.timestamp)}
                    </p>
                    {event.details && (
                      <p className="text-xs text-gray-500 mt-1">{event.details}</p>
                    )}
                  </div>
                </div>
                <Badge variant={getRiskLevelColor(event.riskLevel)} size="sm">
                  {event.riskLevel}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Setup Modal */}
      <Modal
        isOpen={isTwoFactorModalOpen}
        onClose={() => {
          setIsTwoFactorModalOpen(false);
          setTwoFactorSetup(null);
          setVerificationToken('');
        }}
        title="Enable Two-Factor Authentication"
        size="lg"
      >
        <div className="space-y-6">
          {!twoFactorSetup ? (
            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <ShieldCheckIcon className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure Your Account
                </h3>
                <p className="text-gray-600">
                  Two-factor authentication adds an extra layer of security to your account.
                  You'll need your phone to sign in.
                </p>
              </div>
              
              <Button
                variant="primary"
                onClick={handleEnableTwoFactor}
                isLoading={isSubmitting}
                leftIcon={<QrCodeIcon className="w-5 h-5" />}
              >
                Set Up Two-Factor Auth
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR Code Section */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Scan QR Code
                </h3>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorSetup.qrCodeUrl)}`}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Scan this QR code with your authenticator app
                </p>
              </div>

              {/* Manual Setup */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Manual setup key:</strong>
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                    {twoFactorSetup.secret}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(twoFactorSetup.secret)}
                    leftIcon={<DocumentDuplicateIcon className="w-4 h-4" />}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      Save Your Backup Codes
                    </p>
                    <p className="text-xs text-yellow-700 mb-3">
                      Store these codes in a safe place. You can use them to access your account if you lose your phone.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {twoFactorSetup.backupCodes.map((code, index) => (
                        <code key={index} className="bg-white px-2 py-1 rounded text-xs font-mono border">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter verification code from your app
                </label>
                <input
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleVerifyTwoFactor}
                  isLoading={isSubmitting}
                  disabled={!verificationToken}
                >
                  Verify & Enable
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTwoFactorModalOpen(false);
                    setTwoFactorSetup(null);
                    setVerificationToken('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title="Change Password"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Password Requirements:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
              <li>At least 8 characters long</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include at least one number</li>
              <li>Include at least one special character</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleChangePassword}
              isLoading={isSubmitting}
              disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};