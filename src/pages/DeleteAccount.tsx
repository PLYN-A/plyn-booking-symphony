
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/transitions/PageTransition';

const DeleteAccount = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="mb-8">
            <Link to="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Delete Your PLYN Account</h1>
            <p className="text-muted-foreground mt-2">
              This page provides information about deleting your PLYN account and the associated data.
            </p>
          </div>

          <div className="grid gap-8">
            {/* App Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  About PLYN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  <strong>App Name:</strong> PLYN - Beauty & Salon Booking Platform
                </p>
                <p>
                  <strong>Developer:</strong> PLYN Technologies
                </p>
                <p>
                  <strong>Description:</strong> PLYN is a comprehensive platform that connects customers with beauty salons and service providers, enabling easy booking and management of beauty appointments.
                </p>
              </CardContent>
            </Card>

            {/* Steps to Delete Account */}
            <Card>
              <CardHeader>
                <CardTitle>How to Delete Your Account</CardTitle>
                <CardDescription>
                  Follow these steps to permanently delete your PLYN account:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>
                    <strong>Review the information below</strong> about what data will be deleted and what will be retained.
                  </li>
                  <li>
                    <strong>Cancel any active bookings</strong> or services before proceeding with account deletion.
                  </li>
                  <li>
                    <strong>Download any important data</strong> you wish to keep, such as booking history or receipts.
                  </li>
                  <li>
                    <strong>Type "DELETE" in the confirmation field</strong> below to confirm you understand the consequences.
                  </li>
                  <li>
                    <strong>Click the "Delete Account" button</strong> to permanently remove your account.
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Data Deletion Information */}
            <Card>
              <CardHeader>
                <CardTitle>Data Deletion & Retention Policy</CardTitle>
                <CardDescription>
                  Information about what happens to your data when you delete your account:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-destructive mb-2">Data That Will Be Permanently Deleted:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your personal profile information (name, email, phone number, preferences)</li>
                    <li>Account credentials and authentication data</li>
                    <li>Your booking history and appointment records</li>
                    <li>Saved payment methods and transaction history</li>
                    <li>Your favorites and preferences</li>
                    <li>Merchant account data (if applicable)</li>
                    <li>Any uploaded profile pictures or documents</li>
                    <li>Communication history and support tickets</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-amber-600 mb-2">Data That May Be Retained:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Anonymized analytics data for service improvement (30 days)</li>
                    <li>Financial records required for tax and legal compliance (7 years)</li>
                    <li>Security logs for fraud prevention (1 year)</li>
                    <li>Data required to resolve disputes or legal matters</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Retention Period:</h4>
                  <p className="text-sm">
                    Most personal data is deleted immediately upon account deletion. However, some data may be retained for legal, security, or operational reasons as outlined above. All retained data will be permanently purged within the specified timeframes.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Warning and Deletion Form */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Permanent Account Deletion
                </CardTitle>
                <CardDescription>
                  <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmDelete" className="text-sm font-semibold">
                    Type "DELETE" to confirm account deletion:
                  </Label>
                  <Input
                    id="confirmDelete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE here"
                    className="border-destructive/50"
                    disabled={isDeleting}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || confirmText !== 'DELETE'}
                    className="flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                        Deleting Account...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Account Permanently
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  If you have questions about account deletion or need assistance, please contact our support team:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li>Email: support@plyn.app</li>
                  <li>Response time: Within 24-48 hours</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DeleteAccount;
