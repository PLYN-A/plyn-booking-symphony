import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, CreditCard, HelpCircle, LogOut, Settings, Store, Heart, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserCoins, getUserProfile } from '@/utils/userUtils';
import { useFavorites } from '@/hooks/useFavorites';
import PageTransition from '@/components/transitions/PageTransition';
import DeleteAccountDialog from '@/components/profile/DeleteAccountDialog';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { favorites } = useFavorites();
  const [coins, setCoins] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isMerchant, setIsMerchant] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const userCoins = await getUserCoins(user.id);
          setCoins(userCoins);
          
          const userProfile = await getUserProfile(user.id);
          setProfile(userProfile);
          
          // Check if user is a merchant
          const { data, error } = await supabase
            .from('merchants')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (data && !error) {
            setIsMerchant(true);
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchProfileData();
  }, [user, toast]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <PageTransition>
      <div className="container mx-auto py-12">
        <Card className="shadow-md rounded-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Profile</CardTitle>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              Logout
              <LogOut className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{profile?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profile?.full_name || 'User'}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </div>
              </div>
              
              <div className="grid gap-2">
                <p className="text-lg font-semibold">Account Balance</p>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{coins} Coins</span>
                </div>
              </div>
              
              <div className="grid gap-2">
                <p className="text-lg font-semibold">Settings</p>
                <Button variant="ghost" className="justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => navigate('/my-bookings')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  My Bookings
                </Button>
                <Button variant="ghost" className="justify-start">
                  <Heart className="mr-2 h-4 w-4" />
                  My Favorites ({favorites.length})
                </Button>
                {isMerchant ? (
                  <Button variant="ghost" className="justify-start" onClick={() => navigate('/merchant-dashboard')}>
                    <Store className="mr-2 h-4 w-4" />
                    Merchant Dashboard
                  </Button>
                ) : (
                  <Button variant="ghost" className="justify-start" onClick={() => navigate('/merchant-signup')}>
                    <Store className="mr-2 h-4 w-4" />
                    Become a Merchant
                  </Button>
                )}
                <Button variant="ghost" className="justify-start">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </Button>
                
                {/* Danger Zone */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-lg font-semibold text-destructive mb-2">Danger Zone</p>
                  <Button 
                    variant="outline" 
                    className="justify-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteAccountDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </PageTransition>
  );
};

export default Profile;
