import axios from 'axios';

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || "https://localhost:7052/api";

export interface SecurityEvent {
  id: string;
  eventType: string;
  timestamp: string;
  ipAddress: string;
  location: string;
  riskLevel: string;
  details: string;
}

export interface UserSession {
  id: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastAccessedAt: string;
  isCurrent: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  message: string;
}

export interface SecurityReport {
  period: string;
  totalEvents: number;
  loginAttempts: number;
  failedLogins: number;
  suspiciousActivities: number;
  uniqueIpAddresses: number;
  topRiskEvents: SecurityEvent[];
}

export const securityApi = {
  // Two-Factor Authentication
  enableTwoFactor: async (email: string, recoveryEmail?: string): Promise<TwoFactorSetup> => {
    const { data } = await axios.post(`${API_BASE_URL}/security/enable-2fa`, {
      email,
      recoveryEmail
    });
    return data;
  },

  verifyTwoFactor: async (token: string): Promise<{ message: string }> => {
    const { data } = await axios.post(`${API_BASE_URL}/security/verify-2fa`, { token });
    return data;
  },

  useBackupCode: async (code: string): Promise<{ message: string }> => {
    const { data } = await axios.post(`${API_BASE_URL}/security/use-backup-code`, { code });
    return data;
  },

  // Session Management
  getUserSessions: async (): Promise<UserSession[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/security/sessions`);
    return data;
  },

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    const { data } = await axios.post(`${API_BASE_URL}/security/revoke-session/${sessionId}`);
    return data;
  },

  revokeAllSessions: async (): Promise<{ message: string }> => {
    const { data } = await axios.post(`${API_BASE_URL}/security/revoke-all-sessions`);
    return data;
  },

  // Security Events
  getSecurityEvents: async (page: number = 1, pageSize: number = 20): Promise<SecurityEvent[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/security/security-events`, {
      params: { page, pageSize }
    });
    return data;
  },

  // Security Report (Admin only)
  getSecurityReport: async (from?: Date, to?: Date): Promise<SecurityReport> => {
    const params: any = {};
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();
    
    const { data } = await axios.get(`${API_BASE_URL}/security/security-report`, { params });
    return data;
  },

  // Password Management
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await axios.post(`${API_BASE_URL}/security/change-password`, {
      currentPassword,
      newPassword
    });
    return data;
  }
};