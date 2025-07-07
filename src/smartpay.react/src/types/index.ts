// types/models.ts
export interface MilestoneCreate {
  title: string;
  description: string;
  amount: number;
  dueDate: string; // ISO string
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

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator" | "client";
  avatar?: string;
}

export interface Job extends JobCreate {
  id: string;
  status: "pending" | "active" | "completed" | "disputed";
  createdAt: string;
  updatedAt: string;
  title: any;
  description: any;
  milestones: Milestone[];
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Milestone extends MilestoneCreate {
  id: string;
  status: "pending" | "in_progress" | "completed" | "released";
  conditions: PaymentCondition[];
  evidence?: Evidence[];
}

export interface PaymentCondition {
  id: string;
  type: "time" | "location" | "approval" | "iot" | "custom";
  operator: "equals" | "greater_than" | "less_than" | "contains";
  value: string;
  description: string;
}

export interface Evidence {
  id: string;
  type: "photo" | "document" | "gps" | "signature";
  url: string;
  description: string;
  timestamp: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  address: string;
  type: "fiat" | "crypto";
  isActive: boolean;
}

export interface Transaction {
  id: string;
  walletId: string;
  jobId?: string;
  amount: number;
  currency: string;
  type: "escrow" | "release" | "refund" | "deposit" | "withdrawal";
  status: "pending" | "completed" | "failed";
  description: string;
  timestamp: string;
  processorRef?: string;
}

export interface PaymentRule {
  id: string;
  name: string;
  description: string;
  conditions: PaymentCondition[];
  actions: PaymentAction[];
  isActive: boolean;
  createdAt: string;
}

export interface PaymentAction {
  id: string;
  type: "release" | "hold" | "notify" | "split";
  parameters: Record<string, any>;
  description: string;
}

export interface Analytics {
  totalVolume: number;
  totalJobs: number;
  successRate: number;
  averageCompletionTime: number;
  recentTransactions: Transaction[];
  monthlyTrends: {
    month: string;
    volume: number;
    jobs: number;
  }[];
}
