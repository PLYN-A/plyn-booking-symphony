
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, Calendar, Users } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import PhoneSignup from './PhoneSignup';

const signupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
  age: z.string().refine(val => !val || (parseInt(val) >= 18 && parseInt(val) <= 100), {
    message: 'Age must be between 18 and 100',
  }).optional(),
  gender: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      age: '',
      gender: '',
    },
  });

  const onSignupSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      console.log("Signing up with values:", values);
      
      const username = values.username;
      
      await signUp(
        values.email, 
        values.password, 
        username, 
        values.phoneNumber, 
        values.age ? parseInt(values.age) : undefined, 
        values.gender,
        false
      );
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!"
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="email" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="phone">Phone</TabsTrigger>
      </TabsList>
      
      <TabsContent value="email">
        <Form {...signupForm}>
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
            <FormField
              control={signupForm.control}
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
              control={signupForm.control}
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
                      />
                    </FormControl>
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="+1 (123) 456-7890"
                        {...field}
                        className="pl-10"
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
                control={signupForm.control}
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
                control={signupForm.control}
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
            
            <FormField
              control={signupForm.control}
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
                      />
                    </FormControl>
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="pl-10"
                      />
                    </FormControl>
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mt-2 text-center">
              <p className="text-sm text-muted-foreground">
                Are you a salon owner? <a href="/merchant-login" className="text-primary hover:underline">Sign up as a merchant</a>
              </p>
            </div>
            
            <AnimatedButton
              variant="gradient"
              type="submit"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </AnimatedButton>
          </form>
        </Form>
      </TabsContent>
      
      <TabsContent value="phone">
        <PhoneSignup />
      </TabsContent>
    </Tabs>
  );
};

export default Signup;
