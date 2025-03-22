
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PageTransition from '@/components/transitions/PageTransition';
import Login from '@/components/auth/Login';
import Signup from '@/components/auth/Signup';
import AuthHeader from '@/components/auth/AuthHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Auth = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [showMerchantFields, setShowMerchantFields] = useState(false);
  const { user, isMerchant, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (isMerchant) {
        navigate('/merchant-dashboard');
      } else if (isAdmin) {
        navigate('/admin-dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, isMerchant, isAdmin, navigate]);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-20">
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="glass-card p-6 md:p-8 rounded-xl shadow-lg"
              >
                <AuthHeader activeTab={activeTab} showMerchantFields={showMerchantFields} />
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Login />
                    <div className="mt-4 text-sm text-center">
                      <p className="text-muted-foreground">
                        Are you a salon owner? <a href="/merchant-login" className="text-salon-men hover:underline">Sign in as a merchant</a>
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <Signup />
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Auth;
