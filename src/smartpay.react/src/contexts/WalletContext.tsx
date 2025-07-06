import React, { createContext, useContext, useEffect, useState } from "react";
import { Wallet, Transaction } from "../types";
import { fetchTransactions, fetchWallets } from "../services/api";

interface WalletContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  isLoading: boolean;
  refreshWallets: () => void;
  createWallet: (type: "fiat" | "crypto", currency: string) => Promise<void>;
  getTotalBalance: (currency?: string) => number;
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

  return (
    <WalletContext.Provider
      value={{
        wallets,
        transactions,
        isLoading,
        refreshWallets,
        createWallet,
        getTotalBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
