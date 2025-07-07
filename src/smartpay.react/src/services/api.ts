import axios from "axios";
import { Job, Transaction, Wallet } from "../types";

export interface MilestoneCreate {
  title: string;
  description: string;
  amount: number;
  dueDate: string; // ISO string (e.g. 2025-08-15T23:59:59Z)
}

export interface JobCreate {
  title: string;
  description: string;
  client: string;
  contractor: string;
  totalAmount: number;
  currency: string;
  milestones: MilestoneCreate[];
}
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || "https://localhost:7052/api";

export const fetchJobs = async (): Promise<Job[]> => {
  const res = await axios.get<Job[]>(`${API_BASE_URL}/jobs`);
  return res.data;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchWallets = async (userId: string): Promise<Wallet[]> => {
  const { data } = await axios.get<Wallet[]>(`${API_BASE_URL}/wallets`, { params: { userId } });
  return data;
};

export const createWallet = async (userId: string, type: "fiat" | "crypto", currency: string) => {
  await axios.post(`${API_BASE_URL}/wallets`, { userId, type, currency });
};

export const fetchTransactions = async (walletId: string): Promise<Transaction[]> => {
  const { data } = await axios.get<Transaction[]>(`${API_BASE_URL}/wallets/${walletId}/transactions`);
  return data;
};

export const sendFunds = async (walletId: string, amount: number, currency: string, toAddress: string) => {
  const { data } = await axios.post(`${API_BASE_URL}/wallets/${walletId}/send`, {
    amount,
    currency,
    toAddress
  });
  return data;
};

export const receiveFunds = async (walletId: string, amount: number, currency: string, description?: string) => {
  const { data } = await axios.post(`${API_BASE_URL}/wallets/${walletId}/receive`, {
    amount,
    currency,
    description
  });
  return data;
};

export const getWallet = async (walletId: string): Promise<Wallet> => {
  const { data } = await axios.get<Wallet>(`${API_BASE_URL}/wallets/${walletId}`);
  return data;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: { email: string; password: string }) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  refreshToken: () => api.post("/auth/refresh"),
};

export const jobsApi = {
  getJobs: () => api.get("/jobs"),
  getJob: (id: string) => api.get(`/jobs/${id}`),
  createJob: (job: any) => api.post("/jobs", job),
  updateJob: (id: string, job: any) => api.put(`/jobs/${id}`, job),
  deleteJob: (id: string) => api.delete(`/jobs/${id}`),
};

export const walletsApi = {
  getWallets: () => api.get("/wallets"),
  getWallet: (id: string) => api.get(`/wallets/${id}`),
  createWallet: (wallet: any) => api.post("/wallets", wallet),
  getTransactions: (walletId: string) => api.get(`/wallets/${walletId}/transactions`),
};

export const paymentsApi = {
  createPayment: (payment: any) => api.post("/payments", payment),
  releasePayment: (paymentId: string) => api.post(`/payments/${paymentId}/release`),
  getPaymentStatus: (paymentId: string) => api.get(`/payments/${paymentId}/status`),
};

export const rulesApi = {
  getRules: () => api.get("/rules"),
  createRule: (rule: any) => api.post("/rules", rule),
  updateRule: (id: string, rule: any) => api.put(`/rules/${id}`, rule),
  deleteRule: (id: string) => api.delete(`/rules/${id}`),
};

export async function createJob(payload: JobCreate): Promise<Job> {
  try {
    const { data } = await api.post<Job>("/jobs", payload);
    return data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Failed to create job");
  }
}

export const completeMilestone = async (jobId: string, milestoneId: string) => {
  const { data } = await axios.patch(`${API_BASE_URL}/jobs/${jobId}/milestones/${milestoneId}/complete`);
  return data;
};

export const releasePayment = async (jobId: string, milestoneId: string) => {
  const { data } = await axios.post(`${API_BASE_URL}/jobs/${jobId}/milestones/${milestoneId}/release-payment`);
  return data;
};

export const getJobDetails = async (jobId: string): Promise<Job> => {
  console.log('Fetching job details for:', jobId);
  const { data } = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
  console.log('Job details received:', data);
  return data;
};