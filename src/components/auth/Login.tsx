import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Store, Phone } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PhoneAuth from './PhoneAuth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  isMerchant: z.boolean().default(false),
});

const merchantSchema = z.object({
  businessName: z.string().min(3, 'Business name must be at least 3 characters'),
  businessAddress: z.string().min(3, 'Address must be at least 3 characters'),
  businessPhone: z.string().min(5, 'Phone number must be at least 5 characters'),
  businessEmail: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type MerchantLoginFormValues = z.infer<typeof merchantSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const Login = () => {
  const [showMerchantFields, setShowMerchantFields] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      isMerchant: false,
    },
  });

  const merchantLoginForm = useForm<MerchantLoginFormValues>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      businessName: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      password: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signIn(values.email, values.password);
      
      if (values.isMerchant) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_merchant')
          .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
          .single();
          
        if (profileError) {
          console.error("Error fetching profile data:", profileError);
          toast({
            title: "Error",
            description: "Could not verify merchant status. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
          
        if (!profileData?.is_merchant) {
          await supabase.auth.signOut();
          toast({
            title: "Access denied",
            description: "This account is not registered as a merchant.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        try {
          const { data: merchantData, error: merchantError } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
            .single();
            
          if (merchantError) {
            console.log("Merchant profile not found, redirecting to setup:", merchantError);
            navigate('/merchant-signup');
            return;
          }
          
          console.log("Merchant data found, redirecting to dashboard:", merchantData);
          navigate('/merchant-dashboard');
        } catch (error) {
          console.error("Error checking merchant data:", error);
          navigate('/merchant-signup');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onMerchantLoginSubmit = async (values: MerchantLoginFormValues) => {
    setIsLoading(true);
    try {
      console.log("Attempting merchant login with:", values);
      
      const { data: merchants, error: merchantError } = await supabase
        .from('merchants')
        .select('*, profiles(email)')
        .eq('business_name', values.businessName)
        .eq('business_email', values.businessEmail)
        .eq('business_phone', parseInt(values.businessPhone))
        .eq('business_address', values.businessAddress);
        
      if (merchantError) {
        console.error("Error fetching merchant data:", merchantError);
        throw new Error("Error verifying merchant details");
      }
      
      if (!merchants || merchants.length === 0) {
        toast({
          title: "Merchant login failed",
          description: "No matching merchant account found. Please check your business details.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const merchant = merchants[0];
      console.log("Merchant found:", merchant);
      const userEmail = merchant.business_email;
      
      try {
        await signIn(userEmail, values.password);
        
        console.log("Sign in successful, redirecting to merchant dashboard");
        navigate('/merchant-dashboard');
      } catch (signInError: any) {
        console.error("Sign in error:", signInError);
        toast({
          title: "Authentication failed",
          description: "Invalid credentials. Please check your password.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Merchant login error:", error);
      toast({
        title: "Merchant login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions.",
      });

      setShowForgotPassword(false);
      forgotPasswordForm.reset();
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Form {...forgotPasswordForm}>
        <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">Reset Password</h3>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we'll send you a password reset link.
            </p>
          </div>
          
          <FormField
            control={forgotPasswordForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      {...field}
                      className="pl-10"
                      type="email"
                      autoComplete="email"
                    />
                  </FormControl>
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
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
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </AnimatedButton>
            
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-sm text-primary underline text-center"
            >
              Back to login
            </button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Tabs defaultValue="email" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="phone">Phone</TabsTrigger>
      </TabsList>
      
      <TabsContent value="email">
        {!showMerchantFields ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="your@email.com"
                          {...field}
                          className="pl-10"
                          type="email"
                          autoComplete="email"
                        />
                      </FormControl>
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="pl-10"
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={loginForm.control}
                name="isMerchant"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Sign in as a merchant
                      </FormLabel>
                    </div>
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
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </AnimatedButton>
                
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary underline text-center"
                >
                  Forgot password?
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowMerchantFields(true)}
                  className="text-sm text-primary underline text-center"
                >
                  Sign in with business details instead
                </button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...merchantLoginForm}>
            <form onSubmit={merchantLoginForm.handleSubmit(onMerchantLoginSubmit)} className="space-y-4">
              <FormField
                control={merchantLoginForm.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Your business name"
                          {...field}
                          className="pl-10"
                        />
                      </FormControl>
                      <Store className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={merchantLoginForm.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="business@example.com"
                          {...field}
                          className="pl-10"
                          type="email"
                          autoComplete="email"
                        />
                      </FormControl>
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={merchantLoginForm.control}
                name="businessPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="(123) 456-7890"
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
              
              <FormField
                control={merchantLoginForm.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Your business address"
                          {...field}
                          className="pl-10"
                        />
                      </FormControl>
                      <Store className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={merchantLoginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="pl-10"
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
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
                  {isLoading ? 'Signing in...' : 'Sign In as Merchant'}
                </AnimatedButton>
                
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary underline text-center"
                >
                  Forgot password?
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowMerchantFields(false)}
                  className="text-sm text-primary underline text-center"
                >
                  Go back to regular login
                </button>
              </div>
            </form>
          </Form>
        )}
      </TabsContent>
      
      <TabsContent value="phone">
        <PhoneAuth />
      </TabsContent>
    </Tabs>
  );
};

export default Login;
