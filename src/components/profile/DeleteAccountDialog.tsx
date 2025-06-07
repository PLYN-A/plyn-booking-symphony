
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ open, onOpenChange }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (confirmText !== 'DELETE') {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      // First delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Delete merchant data if exists
      const { error: merchantError } = await supabase
        .from('merchants')
        .delete()
        .eq('id', user.id);

      if (merchantError) {
        console.error('Error deleting merchant data:', merchantError);
      }

      // Delete merchant settings if exists
      const { error: settingsError } = await supabase
        .from('merchant_settings')
        .delete()
        .eq('merchant_id', user.id);

      if (settingsError) {
        console.error('Error deleting merchant settings:', settingsError);
      }

      // Finally delete the auth user (this will cascade to other related data)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        throw authError;
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Sign out and redirect
      await signOut();
      navigate('/');
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmText('');
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
            </p>
            <p className="font-semibold">
              This includes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Your profile and personal information</li>
              <li>All your bookings and booking history</li>
              <li>Your coins and payment history</li>
              <li>Merchant data (if applicable)</li>
              <li>All favorites and preferences</li>
            </ul>
            <div className="space-y-2">
              <Label htmlFor="confirmDelete" className="text-sm font-semibold">
                Type "DELETE" to confirm:
              </Label>
              <Input
                id="confirmDelete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE here"
                className="border-destructive/50"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmText !== 'DELETE'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
