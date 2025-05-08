
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Calendar, Layout } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AuthNav = () => {
  const { user, signOut, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getInitial = () => {
    if (userProfile?.username) {
      return userProfile.username.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  const handleSignOut = async () => {
    try {
      console.log("Sign out initiated from AuthNav");
      await signOut();
      console.log("Sign out successful, navigating to auth page");
      
      window.localStorage.removeItem('supabase.auth.token');
      navigate('/auth', { replace: true });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="default">Sign In</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarFallback className="bg-gradient-to-r from-salon-men to-salon-women text-white">
            {getInitial()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{userProfile?.username || 'User'}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const ProfileDropdown = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const navigate = useNavigate();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center rounded-full border border-border p-1 text-sm font-medium hover:bg-accent/50">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.avatar_url || ''}
              alt={user.email || 'User'} 
            />
            <AvatarFallback>
              {(user.email?.charAt(0) || 'U').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role || 'Customer'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
          <Calendar className="mr-2 h-4 w-4" />
          <span>My Bookings</span>
        </DropdownMenuItem>
        {user.is_merchant && (
          <DropdownMenuItem onClick={() => navigate('/merchant-dashboard')}>
            <Layout className="mr-2 h-4 w-4" />
            <span>Merchant Dashboard</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthNav;
