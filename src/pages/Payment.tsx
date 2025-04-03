import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkSlotAvailability, createBooking, bookSlot } from '@/utils/bookingUtils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PaymentForm, { PaymentFormValues } from '@/components/payment/PaymentForm';
import { usePayment } from '@/hooks/usePayment';
import PageTransition from '@/components/transitions/PageTransition';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { processPayment, isProcessing } = usePayment();
  const [userCoins, setUserCoins] = useState(0);
  const [plyCoinsEnabled, setPlyCoinsEnabled] = useState(false);
  const [paymentCanceled, setPaymentCanceled] = useState(false);
  
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
    slotId,
    workerId
  } = location.state || {};
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('canceled') === 'true' || location.state?.canceled) {
      setPaymentCanceled(true);
    }
    
    if (!salonId || !services || !date || !timeSlot || !totalPrice) {
      toast({
        title: "Invalid Booking Details",
        description: "Missing booking details. Please book again.",
        variant: "destructive",
      });
      navigate('/book-now');
      return;
    }
    
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
      
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('merchant_settings')
          .select('*')
          .eq('merchant_id', salonId)
          .limit(1);
          
        if (!settingsError && settingsData && settingsData.length > 0) {
          setPlyCoinsEnabled(true);
        } else {
          console.log("No merchant settings found, defaulting to enabled");
          setPlyCoinsEnabled(true);
        }
      } catch (error) {
        console.error("Error checking settings:", error);
        setPlyCoinsEnabled(true);
      }
    };
    
    fetchUserData();
  }, [user, navigate, toast, salonId, services, date, timeSlot, totalPrice, location]);
  
  const handlePayment = async (values: PaymentFormValues) => {
    try {
      let slotToUse = slotId;
      let workerIdToUse = workerId;
      
      if (slotToUse) {
        const { data: slotExists, error: slotError } = await supabase
          .from('slots')
          .select('is_booked, worker_id')
          .eq('id', slotToUse)
          .single();
        
        if (slotError) {
          toast({
            title: "Slot not found",
            description: "The selected time slot is no longer available. Please select another time.",
            variant: "destructive",
          });
          navigate(`/book/${salonId}`);
          return;
        }
        
        if (slotExists.is_booked) {
          toast({
            title: "Slot already booked",
            description: "Sorry, this time slot has just been booked. Please select another time.",
            variant: "destructive",
          });
          navigate(`/book/${salonId}`);
          return;
        }
        
        if (slotExists.worker_id) {
          workerIdToUse = slotExists.worker_id;
        }
      } else {
        try {
          const { data: slots } = await supabase
            .from('slots')
            .select('id, is_booked, worker_id')
            .eq('merchant_id', salonId)
            .eq('date', date)
            .eq('start_time', timeSlot);
          
          if (!slots || slots.length === 0) {
            toast({
              title: "Slot not found",
              description: "The selected time slot is no longer available. Please select another time.",
              variant: "destructive",
            });
            navigate(`/book/${salonId}`);
            return;
          }
          
          const availableSlot = slots.find(slot => !slot.is_booked);
          
          if (!availableSlot) {
            toast({
              title: "Slot no longer available",
              description: "Sorry, this time slot has just been booked. Please select another time.",
              variant: "destructive",
            });
            navigate(`/book/${salonId}`);
            return;
          }
          
          slotToUse = availableSlot.id;
          
          if (availableSlot.worker_id) {
            workerIdToUse = availableSlot.worker_id;
          }
          
          if (!workerIdToUse) {
            try {
              const { data: availableWorkers, error: workersError } = await supabase
                .from('workers')
                .select('id')
                .eq('merchant_id', salonId)
                .eq('is_active', true)
                .limit(1);
              
              if (!workersError && availableWorkers && availableWorkers.length > 0) {
                workerIdToUse = availableWorkers[0].id;
              }
            } catch (error) {
              console.error("Error finding available worker:", error);
            }
          }
        } catch (error) {
          console.error("Error with slot:", error);
          toast({
            title: "Slot Error",
            description: error.message || "There was an issue with your selected time slot.",
            variant: "destructive",
          });
          navigate(`/book/${salonId}`);
          return;
        }
      }

      await bookSlot(slotToUse);
          
      const bookingData = {
        user_id: user?.id,
        merchant_id: salonId,
        salon_id: salonId,
        salon_name: salonName,
        service_name: services.map((s: any) => s.name).join(', '),
        service_price: totalPrice,
        service_duration: totalDuration,
        booking_date: date,
        time_slot: timeSlot,
        customer_email: values.email,
        customer_phone: values.phone,
        additional_notes: values.notes,
        status: 'pending',
        slot_id: slotToUse,
        worker_id: workerIdToUse || null,
        coins_earned: 0,
        coins_used: values.paymentMethod === 'plyn_coins' ? totalPrice * 2 : 0
      };
      
      const { id: bookingId } = await createBooking(bookingData);
      
      await processPayment({
        paymentMethod: values.paymentMethod,
        amount: totalPrice,
        booking: {
          id: bookingId,
          salonName,
          services,
          date,
          timeSlot,
          totalPrice,
          totalDuration,
          coinsUsed: values.paymentMethod === 'plyn_coins' ? totalPrice * 2 : 0
        }
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment. Please try again.",
        variant: "destructive",
      });
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
            
            {paymentCanceled && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Payment Canceled</AlertTitle>
                <AlertDescription>
                  Your previous payment attempt was canceled. Please try again.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Booking Summary</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Salon:</Badge>
                  <span>{salonName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Services:</Badge>
                  <span>{services.map((s: any) => s.name).join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Date:</Badge>
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Time:</Badge>
                  <span>{timeSlot}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Total:</Badge>
                  <span>${totalPrice}</span>
                </div>
              </div>
            </div>
            
            <PaymentForm
              defaultValues={{
                email: email || '',
                phone: phone || '',
                notes: notes || '',
              }}
              onSubmit={handlePayment}
              isSubmitting={isProcessing}
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
