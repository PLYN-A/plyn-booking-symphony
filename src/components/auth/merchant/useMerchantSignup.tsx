
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MerchantFormData {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  serviceCategory: string;
  // Add any other fields needed
}

export interface PaymentDetailsData {
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

interface UseMerchantSignupProps {
  initialStep?: number;
}

export const useMerchantSignup = ({ initialStep = 1 }: UseMerchantSignupProps = {}) => {
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MerchantFormData>({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    serviceCategory: 'salon',
  });
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsData>({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const updateFormData = (data: Partial<MerchantFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const saveBusinessInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Save to supabase using RPC function
      const { error: rpcError } = await supabase.rpc(
        'insert_merchant_record',
        {
          user_id: '00000000-0000-0000-0000-000000000001', // This should be the actual user ID
          b_name: formData.businessName,
          b_address: formData.businessAddress,
          b_email: formData.businessEmail,
          b_phone: formData.businessPhone,
          s_category: formData.serviceCategory,
        },
      );

      if (rpcError) throw rpcError;

      // Move to next step
      setStep(step + 1);
      
    } catch (err: any) {
      console.error('Error saving business info:', err);
      setError(err.message || 'An unexpected error occurred');
      
      toast({
        title: "Error",
        description: err.message || 'Failed to save business information',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentDetails = async (values: PaymentDetailsData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Save payment details if provided
      if (values.accountNumber && values.ifscCode) {
        const { error: merchantSettingsError } = await supabase
          .from('merchant_settings')
          .upsert({
            merchant_id: '00000000-0000-0000-0000-000000000001', // This should be the actual user ID
            account_holder_name: values.accountName,
            account_number: values.accountNumber,
            ifsc_code: values.ifscCode,
          });
          
        if (merchantSettingsError) throw merchantSettingsError;
      }
      
      // Move to the next step
      setStep(step + 1);
      
    } catch (err: any) {
      console.error('Error saving payment details:', err);
      setError(err.message || 'An unexpected error occurred');
      
      toast({
        title: "Error",
        description: err.message || 'Failed to save payment details',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Final submission logic, if needed
    navigate('/merchant-login');
  };

  return {
    step,
    setStep,
    loading,
    error,
    formData,
    paymentDetails,
    updateFormData,
    saveBusinessInfo,
    updatePaymentDetails,
    handleSubmit,
  };
};

export default useMerchantSignup;
