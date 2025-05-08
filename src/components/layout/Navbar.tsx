
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Navbar = () => {
  const { user, signOut, userProfile } = useAuth();

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold">
          PLYN
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user && userProfile && (
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                )}
                <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth" className="px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md">
                Login
              </Link>
              <Link to="/auth" className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
