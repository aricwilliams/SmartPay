import React, { createContext, useContext, useEffect, useState } from 'react';
import { Wallet, Transaction } from '../types';

interface WalletContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  isLoading: boolean;
  refreshWallets: () => void;
  createWallet: (type: 'fiat' | 'crypto', currency: string) => Promise<void>;
  getTotalBalance: (currency?: string) => number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockWallets: Wallet[] = [
        {
          id: '1',
          userId: '1',
          balance: 12500.75,
          currency: 'USD',
          address: '0x742d35Cc6634C0532925a3b8D21F5DC1',
          type: 'fiat',
          isActive: true
        },
        {
          id: '2',
          userId: '1',
          balance: 5000.00,
          currency: 'USDC',
          address: '0x742d35Cc6634C0532925a3b8D21F5DC2',
          type: 'crypto',
          isActive: true
        }
      ];

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          walletId: '1',
          jobId: 'job-1',
          amount: 500.00,
          currency: 'USD',
          type: 'escrow',
          status: 'completed',
          description: 'Escrow for delivery job',
          timestamp: '2024-01-15T10:30:00Z',
          processorRef: 'stripe_pi_1234'
        },
        {
          id: '2',
          walletId: '2',
          jobId: 'job-2',
          amount: 1000.00,
          currency: 'USDC',
          type: 'release',
          status: 'completed',
          description: 'Milestone payment released',
          timestamp: '2024-01-14T15:45:00Z',
          processorRef: 'circle_tx_5678'
        }
      ];

      setWallets(mockWallets);
      setTransactions(mockTransactions);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWallets = () => {
    loadWallets();
  };

  const createWallet = async (type: 'fiat' | 'crypto', currency: string) => {
    // Mock wallet creation
    const newWallet: Wallet = {
      id: Date.now().toString(),
      userId: '1',
      balance: 0,
      currency,
      address: `0x${Math.random().toString(16).substr(2, 8)}`,
      type,
      isActive: true
    };
    setWallets(prev => [...prev, newWallet]);
  };

  const getTotalBalance = (currency?: string) => {
    return wallets
      .filter(wallet => !currency || wallet.currency === currency)
      .reduce((total, wallet) => total + wallet.balance, 0);
  };

  return (
    <WalletContext.Provider value={{
      wallets,
      transactions,
      isLoading,
      refreshWallets,
      createWallet,
      getTotalBalance
    }}>
      {children}
    </WalletContext.Provider>
  );
};