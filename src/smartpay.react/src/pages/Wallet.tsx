import React, { useState } from "react";
import { motion } from "framer-motion";
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, CreditCardIcon, BanknotesIcon, ClipboardDocumentIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useWallet } from "../contexts/WalletContext";
import { formatCurrency, formatRelativeTime, formatAddress } from "../utils/formatting";
import toast from "react-hot-toast";

export const Wallet: React.FC = () => {
  const { wallets, transactions, isLoading, createWallet, getTotalBalance, sendFundsFromWallet, receiveFundsToWallet, refreshWallet } = useWallet();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [sendForm, setSendForm] = useState({ amount: "", toAddress: "" });
  const [receiveForm, setReceiveForm] = useState({ amount: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWalletData = selectedWallet ? wallets.find((w) => w.id === selectedWallet) : null;

  const handleSend = async () => {
    if (!selectedWallet || !sendForm.amount || !sendForm.toAddress) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendFundsFromWallet(selectedWallet, parseFloat(sendForm.amount), sendForm.toAddress);
      setIsSendModalOpen(false);
      setSendForm({ amount: "", toAddress: "" });
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async () => {
    if (!selectedWallet || !receiveForm.amount) {
      toast.error("Please enter an amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await receiveFundsToWallet(selectedWallet, parseFloat(receiveForm.amount), receiveForm.description);
      setIsReceiveModalOpen(false);
      setReceiveForm({ amount: "", description: "" });
    } catch (error) {
      // Error is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard!");
  };
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "escrow":
        return <BriefcaseIcon className="w-4 h-4 text-orange-600" />;
      case "release":
        return <ArrowDownIcon className="w-4 h-4 text-green-600" />;
      case "deposit":
        return <ArrowDownIcon className="w-4 h-4 text-green-600" />;
      case "withdrawal":
        return <ArrowUpIcon className="w-4 h-4 text-blue-600" />;
      default:
        return <CreditCardIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "escrow":
        return "text-orange-600";
      case "release":
        return "text-green-600";
      case "deposit":
        return "text-green-600";
      case "withdrawal":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredTransactions = selectedWallet ? transactions.filter((tx) => tx.walletId === selectedWallet) : transactions;

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
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Add Wallet
        </Button>
      </div>

      {/* Total Balance */}
      <Card gradient>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-2">Total Balance</p>
            <p className="text-4xl font-bold text-gray-900 mb-4">{formatCurrency(getTotalBalance("USD"))}</p>
            <div className="flex justify-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">USD</p>
                <p className="text-xl font-semibold">{formatCurrency(getTotalBalance("USD"))}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">USDC</p>
                <p className="text-xl font-semibold">{formatCurrency(getTotalBalance("USDC"))}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet, index) => (
          <motion.div key={wallet.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card hoverable className={`cursor-pointer ${selectedWallet === wallet.id ? "ring-2 ring-blue-500" : ""}`} onClick={() => setSelectedWallet(selectedWallet === wallet.id ? null : wallet.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${wallet.type === "crypto" ? "bg-purple-100" : "bg-blue-100"}`}>
                      {wallet.type === "crypto" ? <BanknotesIcon className={`w-5 h-5 ${wallet.type === "crypto" ? "text-purple-600" : "text-blue-600"}`} /> : <CreditCardIcon className={`w-5 h-5 ${wallet.type === "crypto" ? "text-purple-600" : "text-blue-600"}`} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{wallet.currency}</p>
                      <p className="text-sm text-gray-500 capitalize">{wallet.type}</p>
                    </div>
                  </div>
                  <Badge variant={wallet.isActive ? "success" : "default"}>{wallet.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(wallet.balance, wallet.currency)}</p>
                  <p className="text-sm text-gray-500">{formatAddress(wallet.address)}</p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      setSelectedWallet(wallet.id);
                      setIsSendModalOpen(true);
                    }}
                  >
                    Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedWallet(wallet.id);
                      setIsReceiveModalOpen(true);
                    }}
                  >
                    Receive
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Transaction History
              {selectedWallet && <span className="ml-2 text-sm font-normal text-gray-500">(Filtered by selected wallet)</span>}
            </h3>
            {selectedWallet && (
              <Button size="sm" variant="outline" onClick={() => setSelectedWallet(null)}>
                Show All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transactions found</p>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">{getTransactionIcon(transaction.type)}</div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                        {transaction.jobId && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <BriefcaseIcon className="w-3 h-3 mr-1" />
                            Job Payment
                          </span>
                        )}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="capitalize font-medium">{transaction.type === "release" ? "Milestone Payment" : transaction.type === "escrow" ? "Escrow Hold" : transaction.type}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(transaction.timestamp)}</span>
                        {transaction.processorRef && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">{transaction.processorRef}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === "deposit" || transaction.type === "escrow" || transaction.type === "release" ? "+" : "-"}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <Badge variant={transaction.status === "completed" ? "success" : "warning"} size="sm">
                        {transaction.status}
                      </Badge>
                      {transaction.type === "release" && (
                        <Badge variant="info" size="sm">
                          Released
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Wallet Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Wallet" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="fiat">Fiat</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="USD">USD</option>
              <option value="USDC">USDC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                createWallet("fiat", "USD");
                setIsCreateModalOpen(false);
              }}
            >
              Create Wallet
            </Button>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Send Modal */}
      <Modal
        isOpen={isSendModalOpen}
        onClose={() => {
          setIsSendModalOpen(false);
          setSendForm({ amount: "", toAddress: "" });
        }}
        title={`Send ${selectedWalletData?.currency || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
              <input type="number" step="0.01" value={sendForm.amount} onChange={(e) => setSendForm((prev) => ({ ...prev, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">{selectedWalletData?.currency}</span>
            </div>
            {selectedWalletData && <p className="text-sm text-gray-500 mt-1">Available: {formatCurrency(selectedWalletData.balance, selectedWalletData.currency)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Address</label>
            <input type="text" value={sendForm.toAddress} onChange={(e) => setSendForm((prev) => ({ ...prev, toAddress: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter wallet address" />
            <div className="flex space-x-3 pt-4">
              <Button variant="primary" className="flex-1" onClick={handleSend} isLoading={isSubmitting} disabled={!sendForm.amount || !sendForm.toAddress}>
                Send Funds
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSendModalOpen(false);
                  setSendForm({ amount: "", toAddress: "" });
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Receive Modal */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setReceiveForm({ amount: "", description: "" });
        }}
        title={`Receive ${selectedWalletData?.currency || ""}`}
        size="md"
      >
        <div className="space-y-4">
          {selectedWalletData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Your Wallet Address:</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">{selectedWalletData.address}</code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedWalletData.address)} leftIcon={<ClipboardDocumentIcon className="w-4 h-4" />}>
                  Copy
                </Button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (for simulation)</label>
            <div className="relative">
              <input type="number" step="0.01" value={receiveForm.amount} onChange={(e) => setReceiveForm((prev) => ({ ...prev, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">{selectedWalletData?.currency}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={receiveForm.description}
              onChange={(e) => setReceiveForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Payment for..."
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={handleReceive} isLoading={isSubmitting} disabled={!receiveForm.amount}>
              Simulate Receipt
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsReceiveModalOpen(false);
                setReceiveForm({ amount: "", description: "" });
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
