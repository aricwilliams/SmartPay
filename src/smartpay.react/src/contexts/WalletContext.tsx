import React, { createContext, useContext, useEffect, useState } from "react";
import { Wallet, Transaction } from "../types";
import { fetchTransactions, fetchWallets, sendFunds, receiveFunds, getWallet } from "../services/api";
import toast from 'react-hot-toast';

interface WalletContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  isLoading: boolean;
  refreshWallets: () => void;
  createWallet: (type: "fiat" | "crypto", currency: string) => Promise<void>;
  getTotalBalance: (currency?: string) => number;
  sendFundsFromWallet: (walletId: string, amount: number, toAddress: string) => Promise<void>;
  receiveFundsToWallet: (walletId: string, amount: number, description?: string) => Promise<void>;
  refreshWallet: (walletId: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
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
      const data = await fetchWallets("6B69AEFB-D65C-447B-BE78-98C1FC4E5C0B"); // demo user
      setWallets(data);

      // Pull transactions for all wallets in parallel
      const txArrays = await Promise.all(data.map((w) => fetchTransactions(w.id)));
      setTransactions(txArrays.flat());
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWallets = () => {
    loadWallets();
  };

  const createWallet = async (type: "fiat" | "crypto", currency: string) => {
    // Mock wallet creation
    const newWallet: Wallet = {
      id: Date.now().toString(),
      userId: "1",
      balance: 0,
      currency,
      address: `0x${Math.random().toString(16).substr(2, 8)}`,
      type,
      isActive: true,
    };
    setWallets((prev) => [...prev, newWallet]);
  };

  const getTotalBalance = (currency?: string) => {
    return wallets.filter((wallet) => !currency || wallet.currency === currency).reduce((total, wallet) => total + wallet.balance, 0);
  };

  const sendFundsFromWallet = async (walletId: string, amount: number, toAddress: string) => {
    try {
      console.log('Sending funds:', { walletId, amount, toAddress });
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) throw new Error('Wallet not found');
      
      const result = await sendFunds(walletId, amount, wallet.currency, toAddress);
      console.log('Send funds result:', result);
      toast.success('Funds sent successfully!');
      await loadWallets(); // Refresh all wallets
      console.log('Wallets refreshed after send');
    } catch (error: any) {
      console.error('Send funds error:', error);
      toast.error(error.response?.data?.message || 'Failed to send funds');
      throw error;
    }
  };

  const receiveFundsToWallet = async (walletId: string, amount: number, description?: string) => {
    try {
      console.log('Receiving funds:', { walletId, amount, description });
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) throw new Error('Wallet not found');
      
      const result = await receiveFunds(walletId, amount, wallet.currency, description);
      console.log('Receive funds result:', result);
      toast.success('Funds received successfully!');
      await loadWallets(); // Refresh all wallets
      console.log('Wallets refreshed after receive');
    } catch (error: any) {
      console.error('Receive funds error:', error);
      toast.error(error.response?.data?.message || 'Failed to receive funds');
      throw error;
    }
  };

  const refreshWallet = async (walletId: string) => {
    try {
      const updatedWallet = await getWallet(walletId);
      setWallets(prev => prev.map(w => w.id === walletId ? updatedWallet : w));
      
      // Update transactions for this wallet
      const walletTransactions = await fetchTransactions(walletId);
      setTransactions(prev => [
        ...prev.filter(t => t.walletId !== walletId),
        ...walletTransactions
      ]);
    } catch (error) {
      console.error('Failed to refresh wallet:', error);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallets,
        transactions,
        isLoading,
        refreshWallets,
        createWallet,
        getTotalBalance,
        sendFundsFromWallet,
        receiveFundsToWallet,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
