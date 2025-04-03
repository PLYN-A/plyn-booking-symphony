
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PaymentForm from '@/components/payment/PaymentForm';
import BookingSummary from '@/components/payment/BookingSummary';
import PageTransition from '@/components/transitions/PageTransition';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getUserCoins } from '@/utils/userUtils';
import { createBooking, bookSlot } from '@/utils/bookingUtils';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import PaymentSimulator from '@/components/payment/PaymentSimulator';
import { Button } from '@/components/ui/button';  // Add missing Button import

interface PaymentState {
  salonId: string;
  salonName: string;
  services: any[];
  date: string;
  timeSlot: string;
  email: string;
  phone: string;
  notes: string;
  totalPrice: number;
  totalDuration: number;
  slotId: string;
  workerId: string;
}

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });
  const [userCoins, setUserCoins] = useState<number>(0);

  // Redirect if accessing directly without booking data
  const state = location.state as PaymentState;
  
  if (!state?.salonId) {
    navigate('/book');
    // This return prevents the component from rendering further
    // when there is no state (the user is being redirected)
    return null;
  }

  React.useEffect(() => {
    const fetchUserCoins = async () => {
      if (user) {
        const coins = await getUserCoins(user.id);
        setUserCoins(coins);
      }
    };

    fetchUserCoins();
  }, [user]);

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handlePaymentInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentInfo({
      ...paymentInfo,
      [e.target.name]: e.target.value
    });
  };

  const calculateCoinsUsed = () => {
    // Calculate coins needed based on payment method
    if (paymentMethod === 'plyn_coins') {
      // Full payment with coins (2 coins = $1)
      return state.totalPrice * 2;
    } else if (paymentMethod === 'partial_coins' && userCoins > 0) {
      // Partial payment - use available coins up to half the price
      const maxCoinsToUse = Math.min(userCoins, state.totalPrice);
      return maxCoinsToUse;
    }
    return 0;
  };

  const handleProcessPayment = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete a booking",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const coinsUsed = calculateCoinsUsed();
      const remainingCoinsAfterBooking = userCoins - coinsUsed;
      
      // Validate sufficient coins if using coins payment
      if (paymentMethod === 'plyn_coins' && coinsUsed > userCoins) {
        toast({
          title: "Insufficient Coins",
          description: `You need ${coinsUsed} coins but only have ${userCoins} available.`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // First check if slot is still available before processing payment
      const { data: slot, error: slotError } = await supabase
        .from('slots')
        .select('is_booked, worker_id')
        .eq('id', state.slotId)
        .single();
      
      if (slotError) {
        throw new Error(`Error checking slot availability: ${slotError.message}`);
      }
      
      if (slot.is_booked) {
        throw new Error('This time slot has already been booked. Please select another time.');
      }
      
      // Mark the slot as booked
      await supabase
        .from('slots')
        .update({ is_booked: true })
        .eq('id', state.slotId);
      
      // Update user's coins if used
      if (coinsUsed > 0) {
        await supabase
          .from('profiles')
          .update({ coins: remainingCoinsAfterBooking })
          .eq('id', user.id);
      }
      
      // Generate a unique transaction ID
      const transactionId = `payment_${Date.now()}`;
      
      // Create a booking record
      const bookingData = {
        user_id: user.id,
        merchant_id: state.salonId,
        salon_name: state.salonName,
        service_name: state.services.map((service: any) => service.name).join(", "),
        service_price: state.totalPrice,
        service_duration: state.totalDuration,
        booking_date: state.date,
        time_slot: state.timeSlot,
        customer_email: state.email,
        customer_phone: state.phone || '',
        additional_notes: state.notes || '',
        status: 'pending',
        slot_id: state.slotId,
        worker_id: state.workerId || slot.worker_id || null,
        coins_earned: 0,
        coins_used: coinsUsed
      };
      
      const bookingResponse = await createBooking(bookingData);
      
      // Create a payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          payment_method: paymentMethod,
          amount: state.totalPrice,
          payment_status: 'completed',
          coins_used: coinsUsed,
          transaction_id: transactionId
        })
        .select('id')
        .single();
      
      if (paymentError) {
        throw paymentError;
      }
      
      // Update the booking with payment information
      await supabase
        .from('bookings')
        .update({
          payment_id: paymentData.id,
          payment_status: 'completed',
          status: 'confirmed'
        })
        .eq('id', bookingResponse.id);
      
      // Navigate to confirmation page
      navigate('/booking-confirmation', { 
        state: { 
          booking: {
            ...bookingData,
            id: bookingResponse.id,
            payment_id: paymentData.id,
            payment_method: paymentMethod,
            payment_status: 'completed',
            transaction_id: transactionId
          }
        }
      });
      
    } catch (error: any) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const formattedDate = state.date 
    ? format(new Date(state.date), "EEEE, MMMM d, yyyy")
    : "Unknown date";

  return (
    <PageTransition>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8 text-center">Complete Your Booking</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="order-2 md:order-1">
            {step === 1 ? (
              <div className="space-y-6">
                <PaymentMethodSelector 
                  selectedMethod={paymentMethod} 
                  onMethodChange={handlePaymentMethodChange} 
                  userCoins={userCoins}
                  totalPrice={state.totalPrice}
                />
                
                {paymentMethod === 'credit_card' && (
                  <PaymentForm 
                    defaultValues={{
                      cardName: '',
                      cardNumber: '',
                      expiryDate: '',
                      cvv: '',
                      email: state.email || '',
                      phone: state.phone || '',
                      paymentMethod: paymentMethod,
                      notes: state.notes || ''
                    }}
                    onSubmit={async () => {}}
                    isSubmitting={false}
                    totalPrice={state.totalPrice}
                    userCoins={userCoins}
                    plyCoinsEnabled={true}
                  />
                )}
                
                <div className="pt-4">
                  <Button 
                    onClick={() => setStep(2)} 
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Payment Details</h2>
                  <p>Payment Method: {paymentMethod === 'plyn_coins' ? 'PLYN Coins' : 'Credit Card'}</p>
                  {paymentMethod === 'plyn_coins' && (
                    <p>Using {calculateCoinsUsed()} coins ({userCoins} available)</p>
                  )}
                  <p>Total Amount: ${state.totalPrice}</p>
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleProcessPayment}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? 'Processing...' : 'Complete Payment'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="order-1 md:order-2">
            <BookingSummary
              salonName={state.salonName}
              services={state.services}
              date={formattedDate}
              timeSlot={state.timeSlot}
              totalPrice={state.totalPrice}
              totalDuration={state.totalDuration}
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Payment;
