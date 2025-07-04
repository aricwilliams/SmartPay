import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
};

export const jobsApi = {
  getJobs: () => api.get('/jobs'),
  getJob: (id: string) => api.get(`/jobs/${id}`),
  createJob: (job: any) => api.post('/jobs', job),
  updateJob: (id: string, job: any) => api.put(`/jobs/${id}`, job),
  deleteJob: (id: string) => api.delete(`/jobs/${id}`),
};

export const walletsApi = {
  getWallets: () => api.get('/wallets'),
  getWallet: (id: string) => api.get(`/wallets/${id}`),
  createWallet: (wallet: any) => api.post('/wallets', wallet),
  getTransactions: (walletId: string) => api.get(`/wallets/${walletId}/transactions`),
};

export const paymentsApi = {
  createPayment: (payment: any) => api.post('/payments', payment),
  releasePayment: (paymentId: string) => api.post(`/payments/${paymentId}/release`),
  getPaymentStatus: (paymentId: string) => api.get(`/payments/${paymentId}/status`),
};

export const rulesApi = {
  getRules: () => api.get('/rules'),
  createRule: (rule: any) => api.post('/rules', rule),
  updateRule: (id: string, rule: any) => api.put(`/rules/${id}`, rule),
  deleteRule: (id: string) => api.delete(`/rules/${id}`),
};