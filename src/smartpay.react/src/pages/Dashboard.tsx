import React from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useWallet } from '../contexts/WalletContext';
import { formatCurrency, formatRelativeTime } from '../utils/formatting';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const stats = [
  {
    name: 'Total Volume',
    value: 2847530,
    currency: 'USD',
    change: 12.5,
    icon: CurrencyDollarIcon,
    color: 'from-blue-500 to-purple-500',
  },
  {
    name: 'Active Jobs',
    value: 247,
    change: 8.2,
    icon: BriefcaseIcon,
    color: 'from-teal-500 to-cyan-500',
  },
  {
    name: 'Success Rate',
    value: 98.7,
    suffix: '%',
    change: 2.1,
    icon: ArrowTrendingUpIcon,
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Avg. Time',
    value: 2.5,
    suffix: 'hrs',
    change: -15.3,
    icon: ClockIcon,
    color: 'from-orange-500 to-red-500',
  },
];

const chartData = [
  { month: 'Jan', volume: 120000, jobs: 45 },
  { month: 'Feb', volume: 185000, jobs: 67 },
  { month: 'Mar', volume: 245000, jobs: 89 },
  { month: 'Apr', volume: 320000, jobs: 125 },
  { month: 'May', volume: 420000, jobs: 156 },
  { month: 'Jun', volume: 510000, jobs: 189 },
];


export const Dashboard: React.FC = () => {
  const { transactions, getTotalBalance } = useWallet();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    // Use real transaction data and show only the most recent 5
    const recent = transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        job: tx.description,
        status: tx.status,
        timestamp: tx.timestamp,
        jobId: tx.jobId
      }));
    setRecentTransactions(recent);
  }, [transactions]);
  
  // Calculate dynamic stats from real data
  const totalVolume = getTotalBalance('USD');
  const activeJobs = transactions.filter(tx => tx.type === 'escrow').length;
  const completedPayments = transactions.filter(tx => tx.type === 'release' && tx.status === 'completed').length;
  
  const dynamicStats = [
    {
      name: 'Total Volume',
      value: totalVolume,
      currency: 'USD',
      change: 12.5,
      icon: CurrencyDollarIcon,
      color: 'from-blue-500 to-purple-500',
    },
    {
      name: 'Active Jobs',
      value: activeJobs,
      change: 8.2,
      icon: BriefcaseIcon,
      color: 'from-teal-500 to-cyan-500',
    },
    {
      name: 'Payments Released',
      value: completedPayments,
      change: 2.1,
      icon: ArrowTrendingUpIcon,
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'Avg. Time',
      value: 2.5,
      suffix: 'hrs',
      change: -15.3,
      icon: ClockIcon,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Badge variant="success">Live</Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dynamicStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable gradient>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.currency ? formatCurrency(stat.value, stat.currency) : stat.value}
                      {stat.suffix && <span className="text-lg">{stat.suffix}</span>}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change >= 0 ? '+' : ''}{stat.change}%
                      </span>
                      <span className="text-sm text-gray-500 ml-2">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Payment Volume</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="url(#colorGradient)" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Job Completion</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="jobs" 
                  stroke="url(#colorGradient2)" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="colorGradient2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'release' ? 'bg-green-100' : 
                    transaction.type === 'escrow' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    <CurrencyDollarIcon className={`w-5 h-5 ${
                      transaction.type === 'release' ? 'text-green-600' : 
                      transaction.type === 'escrow' ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.job}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.type === 'release' ? 'Milestone Payment Released' : 
                       transaction.type === 'escrow' ? 'Escrow Created' :
                       transaction.type === 'deposit' ? 'Funds Received' : 'Transaction'}
                      {transaction.jobId && (
                        <span className="ml-2 text-blue-600 font-medium">• Job Payment</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant={transaction.status === 'completed' ? 'success' : 'warning'}>
                      {transaction.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(transaction.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};