
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkSlotAvailability, createBooking } from '@/utils/bookingUtils';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PaymentForm, { PaymentFormValues } from '@/components/payment/PaymentForm';
import PageTransition from '@/components/transitions/PageTransition';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [plyCoinsEnabled, setPlyCoinsEnabled] = useState(false);
  
  const { 
    salonId, 
    salonName, 
    services, 
    date, 
    timeSlot, 
    email, 
    phone, 
    notes, 
    totalPrice, 
    totalDuration,
    slotId
  } = location.state || {};
  
  useEffect(() => {
    if (!salonId || !services || !date || !timeSlot || !totalPrice) {
      toast({
        title: "Invalid Booking Details",
        description: "Missing booking details. Please book again.",
        variant: "destructive",
      });
      navigate('/book-now');
      return;
    }
    
    // Fetch user coins and ply coins settings
    const fetchUserData = async () => {
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
        } else {
          setUserCoins(profileData?.coins || 0);
        }
      }
      
      // Check if settings table exists and fetch ply_coins_enabled
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('merchant_settings')
          .select('*')
          .limit(1);
          
        if (!settingsError) {
          // If merchant_settings exists but doesn't have ply_coins_enabled, default to true
          setPlyCoinsEnabled(true);
        } else {
          console.error("Error fetching settings:", settingsError);
          // Default to enabled if we can't check
          setPlyCoinsEnabled(true);
        }
      } catch (error) {
        console.error("Error checking settings:", error);
        // Default to enabled if we can't check
        setPlyCoinsEnabled(true);
      }
    };
    
    fetchUserData();
  }, [user, navigate, toast, salonId, services, date, timeSlot, totalPrice]);
  
  const handleSubmit = async (values: PaymentFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Verify slot is still available
      const { available } = await checkSlotAvailability(salonId, date, timeSlot);
      
      if (!available) {
        toast({
          title: "Slot no longer available",
          description: "Sorry, this time slot has just been booked. Please select another time.",
          variant: "destructive",
        });
        navigate(`/book/${salonId}`);
        return;
      }
      
      // Prepare booking data
      const bookingData = {
        user_id: user?.id,
        merchant_id: salonId,
        service_name: services.map((s: any) => s.name).join(', '),
        service_price: totalPrice,
        service_duration: totalDuration,
        booking_date: date,
        time_slot: timeSlot,
        customer_email: values.email,
        customer_phone: values.phone,
        notes: values.notes,
        status: 'confirmed',
        payment_method: values.paymentMethod,
        slot_id: slotId
      };
      
      // Create booking
      const { id: bookingId } = await createBooking(bookingData);
      
      // Redirect to booking confirmation
      navigate('/booking-confirmation', { state: { bookingId } });
    } catch (error: any) {
      console.error("Error during payment:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!salonId || !services || !date || !timeSlot || !totalPrice) {
    return null;
  }
  
  return (
    <PageTransition>
      <div className="container mx-auto py-12">
        <Card className="shadow-md rounded-md">
          <CardContent className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Payment</h1>
              <p className="text-muted-foreground">
                Confirm your booking details and complete your payment.
              </p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Booking Summary</h2>
              <p>
                <Badge variant="secondary" className="mr-2">Salon:</Badge>
                {salonName}
              </p>
              <p>
                <Badge variant="secondary" className="mr-2">Services:</Badge>
                {services.map((s: any) => s.name).join(', ')}
              </p>
              <p>
                <Badge variant="secondary" className="mr-2">Date:</Badge>
                {date}
              </p>
              <p>
                <Badge variant="secondary" className="mr-2">Time:</Badge>
                {timeSlot}
              </p>
              <p>
                <Badge variant="secondary" className="mr-2">Total:</Badge>
                ${totalPrice}
              </p>
            </div>
            
            <PaymentForm
              defaultValues={{
                email: email || '',
                phone: phone || '',
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              totalPrice={totalPrice}
              userCoins={userCoins}
              plyCoinsEnabled={plyCoinsEnabled}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Payment;
