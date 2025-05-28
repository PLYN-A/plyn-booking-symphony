
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, User, Calendar, Users } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const phoneSignupSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  age: z.string().refine(val => !val || (parseInt(val) >= 18 && parseInt(val) <= 100), {
    message: 'Age must be between 18 and 100',
  }).optional(),
  gender: z.string().optional(),
});

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits'),
});

type PhoneSignupFormValues = z.infer<typeof phoneSignupSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

const PhoneSignup = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userMetadata, setUserMetadata] = useState<PhoneSignupFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const phoneForm = useForm<PhoneSignupFormValues>({
    resolver: zodResolver(phoneSignupSchema),
    defaultValues: {
      phone: '',
      username: '',
      age: '',
      gender: '',
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onPhoneSubmit = async (values: PhoneSignupFormValues) => {
    setIsLoading(true);
    try {
      // Format phone number to international format
      const formattedPhone = values.phone.startsWith('+') ? values.phone : `+91${values.phone}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        throw error;
      }

      setPhoneNumber(formattedPhone);
      setUserMetadata(values);
      setStep('otp');
      
      toast({
        title: "OTP sent",
        description: `Verification code sent to ${formattedPhone}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async (values: OtpFormValues) => {
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: values.otp,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      // Update user profile with additional metadata
      if (data.user && userMetadata) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: userMetadata.username,
            age: userMetadata.age ? parseInt(userMetadata.age) : null,
            gender: userMetadata.gender || null,
            phone_number: phoneNumber,
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }

      toast({
        title: "Account created successfully",
        description: "Welcome! Your account has been created.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Invalid OTP",
        description: error.message || "Please check the code and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "OTP resent",
        description: `New verification code sent to ${phoneNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <Form {...otpForm}>
        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Enter Verification Code</h3>
            <p className="text-sm text-muted-foreground">
              We sent a code to {phoneNumber}
            </p>
          </div>
          
          <FormField
            control={otpForm.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex flex-col space-y-3 mt-6">
            <AnimatedButton
              variant="gradient"
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </AnimatedButton>
            
            <button
              type="button"
              onClick={resendOtp}
              disabled={isLoading}
              className="text-sm text-primary underline text-center"
            >
              Resend code
            </button>
            
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-sm text-muted-foreground underline text-center"
            >
              Change phone number
            </button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...phoneForm}>
      <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
        <FormField
          control={phoneForm.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="johndoe"
                    {...field}
                    className="pl-10"
                  />
                </FormControl>
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={phoneForm.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="+91 98765 43210"
                    {...field}
                    className="pl-10"
                    type="tel"
                  />
                </FormControl>
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={phoneForm.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age (Optional)</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="25"
                      {...field}
                      className="pl-10"
                    />
                  </FormControl>
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={phoneForm.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender (Optional)</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <Users className="absolute left-3 top-11 h-5 w-5 text-muted-foreground" />
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="pt-4">
          <AnimatedButton
            variant="gradient"
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </AnimatedButton>
        </div>
      </form>
    </Form>
  );
};

export default PhoneSignup;
