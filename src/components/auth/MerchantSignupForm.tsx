
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { merchantSignupSchema, MerchantSignupFormValues } from './merchant/types';
import { useMerchantSignup } from './merchant/useMerchantSignup';
import PersonalInfoFields from './merchant/PersonalInfoFields';
import BusinessInfoFields from './merchant/BusinessInfoFields';
import PasswordFields from './merchant/PasswordFields';
import SubmitButton from './merchant/SubmitButton';
import ErrorAlert from './merchant/ErrorAlert';
import PaymentDetailsForm from '@/components/merchant/PaymentDetailsForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MerchantSignupForm = () => {
  const { isLoading, error, handleSignup } = useMerchantSignup();
  const [currentTab, setCurrentTab] = useState('account');
  const [paymentFormSubmitted, setPaymentFormSubmitted] = useState(false);

  const form = useForm<MerchantSignupFormValues>({
    resolver: zodResolver(merchantSignupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      businessAddress: '',
      businessPhone: '',
      serviceCategory: 'men', // Default to men's salon
      paymentDetails: {
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
      }
    },
  });

  const onSubmit = async (values: MerchantSignupFormValues) => {
    await handleSignup(values);
  };

  const handlePaymentFormSubmit = (paymentValues: any) => {
    form.setValue('paymentDetails', paymentValues);
    setPaymentFormSubmitted(true);
    setCurrentTab('business');
  };

  return (
    <Form {...form}>
      <ErrorAlert error={error} />
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs 
          value={currentTab} 
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4 py-4">
            <PersonalInfoFields form={form} />
            <PasswordFields form={form} />
            <div className="flex justify-end">
              <button 
                type="button" 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md" 
                onClick={() => setCurrentTab('business')}
              >
                Next: Business Info
              </button>
            </div>
          </TabsContent>
          
          <TabsContent value="business" className="space-y-4 py-4">
            <BusinessInfoFields form={form} />
            <div className="flex justify-between">
              <button 
                type="button" 
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md" 
                onClick={() => setCurrentTab('account')}
              >
                Back
              </button>
              <button 
                type="button" 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md" 
                onClick={() => setCurrentTab('payment')}
              >
                Next: Payment Details
              </button>
            </div>
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-4 py-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Payment Account Details</h3>
              <p className="text-sm text-muted-foreground">
                Enter your bank details so you can receive payments from bookings. 
                We'll handle the platform fee (₹2) and commission (1%) automatically.
              </p>
            </div>
            
            <div className="space-y-4">
              <PaymentDetailsForm 
                onSubmit={handlePaymentFormSubmit}
                isSubmitting={false}
                defaultValues={form.getValues().paymentDetails}
              />
            </div>
            
            <div className="flex justify-between">
              <button 
                type="button" 
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md" 
                onClick={() => setCurrentTab('business')}
              >
                Back
              </button>
              <SubmitButton isLoading={isLoading} />
            </div>
          </TabsContent>
        </Tabs>
        
        {currentTab !== 'payment' && (
          <div className="pt-4 border-t mt-6">
            <SubmitButton isLoading={isLoading} disabled={!paymentFormSubmitted} />
            {!paymentFormSubmitted && currentTab !== 'payment' && (
              <p className="text-sm text-muted-foreground mt-2">
                Please fill payment details before submitting
              </p>
            )}
          </div>
        )}
      </form>
    </Form>
  );
};

export default MerchantSignupForm;
