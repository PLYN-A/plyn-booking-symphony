
import { z } from 'zod';

// Payment details schema
const paymentDetailsSchema = z.object({
  accountName: z.string().min(3, 'Account name is required'),
  accountNumber: z.string().min(9, 'Valid account number is required'),
  ifscCode: z.string().min(11, 'Valid IFSC code is required'),
  upiId: z.string().optional(),
});

// Merchant signup schema
export const merchantSignupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  businessName: z.string().min(3, 'Business name is required'),
  businessAddress: z.string().min(5, 'Business address is required'),
  businessPhone: z.string().min(10, 'Valid phone number is required'),
  serviceCategory: z.string().min(1, 'Service category is required'),
  paymentDetails: paymentDetailsSchema.optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type MerchantSignupFormValues = z.infer<typeof merchantSignupSchema>;
export type PaymentDetailsFormValues = z.infer<typeof paymentDetailsSchema>;
