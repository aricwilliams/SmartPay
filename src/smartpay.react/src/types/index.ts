export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'client';
  avatar?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  client: string;
  contractor: string;
  totalAmount: number;
  currency: 'USD' | 'USDC' | 'ETH';
  status: 'pending' | 'active' | 'completed' | 'disputed';
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'released';
  dueDate: string;
  conditions: PaymentCondition[];
  evidence?: Evidence[];
}

export interface PaymentCondition {
  id: string;
  type: 'time' | 'location' | 'approval' | 'iot' | 'custom';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: string;
  description: string;
}

export interface Evidence {
  id: string;
  type: 'photo' | 'document' | 'gps' | 'signature';
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
  type: 'fiat' | 'crypto';
  isActive: boolean;
}

export interface Transaction {
  id: string;
  walletId: string;
  jobId?: string;
  amount: number;
  currency: string;
  type: 'escrow' | 'release' | 'refund' | 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
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
  type: 'release' | 'hold' | 'notify' | 'split';
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