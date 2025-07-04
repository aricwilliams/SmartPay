import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

export const jobSchema = yup.object({
  title: yup.string().required('Job title is required'),
  description: yup.string().required('Job description is required'),
  client: yup.string().required('Client is required'),
  contractor: yup.string().required('Contractor is required'),
  totalAmount: yup.number().positive('Amount must be positive').required('Total amount is required'),
  currency: yup.string().oneOf(['USD', 'USDC', 'ETH']).required('Currency is required'),
});

export const walletSchema = yup.object({
  type: yup.string().oneOf(['fiat', 'crypto']).required('Wallet type is required'),
  currency: yup.string().required('Currency is required'),
});

export const paymentRuleSchema = yup.object({
  name: yup.string().required('Rule name is required'),
  description: yup.string().required('Rule description is required'),
  conditions: yup.array().min(1, 'At least one condition is required'),
  actions: yup.array().min(1, 'At least one action is required'),
});