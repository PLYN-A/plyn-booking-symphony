import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { clearAvailabilityCache } from '@/utils/workerSchedulingUtils';
import { usePayment } from '@/hooks/usePayment';
import { loadRazorpayScript } from '@/utils/razorpayUtils';

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
  const [isBookingCreated, setIsBookingCreated] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('razorpay'); // Default to Razorpay
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });
  const [userCoins, setUserCoins] = useState<number>(0);
  const { processPayment, isProcessing: paymentProcessing } = usePayment();

  const state = location.state as PaymentState;
  
  useEffect(() => {
    if (!state?.salonId) {
      navigate('/book');
    }
  }, [state, navigate]);

  useEffect(() => {
    loadRazorpayScript();
    
    const fetchUserCoins = async () => {
      if (user) {
        const coins = await getUserCoins(user.id);
        setUserCoins(coins);
      }
    };

    if (state) {
      console.log("Payment state:", {
        salonId: state.salonId,
        date: state.date,
        timeSlot: state.timeSlot,
        slotId: state.slotId
      });
    }

    fetchUserCoins();
  }, [user, state]);

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
    if (paymentMethod === 'plyn_coins') {
      return state.totalPrice * 2;
    } else if (paymentMethod === 'partial_coins' && userCoins > 0) {
      const maxCoinsToUse = Math.min(userCoins, state.totalPrice);
      return maxCoinsToUse;
    }
    return 0;
  };

  const createBookingRecord = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete a booking",
        variant: "destructive"
      });
      return null;
    }
    
    if (!state.slotId || state.slotId === 'new') {
      toast({
        title: "Invalid Slot",
        description: "No valid slot was selected. Please go back and select another time.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const { data: slot, error: slotError } = await supabase
        .from('slots')
        .select('is_booked, worker_id')
        .eq('id', state.slotId)
        .maybeSingle();
      
      if (slotError) {
        console.error("Error checking slot availability:", slotError);
        throw new Error(`Error checking slot availability: ${slotError.message}`);
      }
      
      if (!slot) {
        console.error("Slot not found:", state.slotId);
        throw new Error('Slot not found. Please go back and select another time.');
      }
      
      if (slot.is_booked) {
        console.error("Slot is already booked:", state.slotId);
        throw new Error('This time slot has already been booked. Please select another time.');
      }
      
      try {
        await bookSlot(
          state.slotId,
          state.services.map((service: any) => service.name).join(", "),
          state.totalDuration,
          state.totalPrice
        );
        
        clearAvailabilityCache(state.salonId, state.date);
      } catch (bookError: any) {
        console.error("Error booking slot:", bookError);
        throw new Error(`Failed to book slot: ${bookError.message}`);
      }
      
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
        worker_id: state.workerId || slot.worker_id || null
      };
      
      const bookingResponse = await createBooking(bookingData);
      return bookingResponse;
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking Error",
        description: error.message || "Failed to create booking.",
        variant: "destructive"
      });
      return null;
    }
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

    try {
      let currentBookingId = bookingId;
      if (!isBookingCreated) {
        const bookingResult = await createBookingRecord();
        if (!bookingResult) {
          return; // Error already handled in createBookingRecord
        }
        setIsBookingCreated(true);
        setBookingId(bookingResult.id);
        currentBookingId = bookingResult.id;
      }
      
      const platformFee = 2; // ₹2 platform fee
      const totalWithPlatformFee = state.totalPrice + platformFee;
      
      const bookingDetails = {
        id: currentBookingId,
        user_id: user.id,
        merchant_id: state.salonId,
        salonName: state.salonName,
        services: state.services,
        date: state.date,
        timeSlot: state.timeSlot,
        totalPrice: state.totalPrice,
        totalWithPlatformFee: totalWithPlatformFee,
        totalDuration: state.totalDuration,
        email: state.email,
        phone: state.phone,
        platformFee: platformFee
      };
      
      await processPayment({
        paymentMethod,
        amount: state.totalPrice, // Base amount without platform fee
        currency: 'INR',
        booking: bookingDetails
      });
      
    } catch (error: any) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!state) {
    return null;
  }

  const formattedDate = state.date 
    ? format(new Date(state.date), "EEEE, MMMM d, yyyy")
    : "Unknown date";

  const totalWithPlatformFee = state.totalPrice + 2; // Adding ₹2 platform fee

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
                  <p>Payment Method: {
                    paymentMethod === 'plyn_coins' ? 'PLYN Coins' : 
                    paymentMethod === 'razorpay' ? 'Razorpay' : 
                    'Credit Card'
                  }</p>
                  {paymentMethod === 'plyn_coins' && (
                    <p>Using {calculateCoinsUsed()} coins ({userCoins} available)</p>
                  )}
                  <p>Services Total: ₹{state.totalPrice.toFixed(2)}</p>
                  <p>Platform Fee: ₹2.00</p>
                  <p className="font-medium">Total Amount: ₹{totalWithPlatformFee.toFixed(2)}</p>
                  
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
                      disabled={paymentProcessing}
                      className="flex-1"
                    >
                      {paymentProcessing ? 'Processing...' : 'Complete Payment'}
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
              totalPrice={totalWithPlatformFee} // Include platform fee in the display
              totalDuration={state.totalDuration}
              platformFee={2} // Explicitly pass the platform fee
            />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Payment;
