
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Load the Razorpay script if it hasn't been loaded yet
export const loadRazorpayScript = async (): Promise<boolean> => {
  if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
    return true;
  }
  
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Initialize and open Razorpay payment modal
export const openRazorpayCheckout = (
  orderId: string, 
  amount: number, 
  keyId: string,
  bookingDetails: any,
  onSuccess: (response: any) => void,
  onError: (error: any) => void,
  onDismiss: () => void
) => {
  if (!window.Razorpay) {
    console.error('Razorpay SDK not available');
    onError(new Error('Razorpay SDK failed to load'));
    return;
  }

  console.log(`Opening Razorpay checkout for order: ${orderId}, amount: ${amount}, keyId: ${keyId}`);
  console.log('Booking details:', bookingDetails);
  
  const options = {
    key: keyId,
    amount: amount * 100, // Convert to paise
    currency: bookingDetails.currency || 'INR',
    name: 'Salon Booking',
    description: 'Payment for salon services',
    order_id: orderId,
    handler: function(response: any) {
      console.log('Razorpay payment successful:', response);
      onSuccess(response);
    },
    prefill: {
      name: bookingDetails.customerName || '',
      email: bookingDetails.email || '',
      contact: bookingDetails.phone || ''
    },
    theme: {
      color: '#3498db'
    },
    modal: {
      ondismiss: function() {
        console.log('Razorpay checkout dismissed');
        onDismiss();
      }
    }
  };
  
  try {
    console.log('Creating Razorpay instance with options:', options);
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error);
    onError(error);
  }
};

// Verify a Razorpay payment with our backend
export const verifyRazorpayPayment = async (
  orderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  try {
    console.log(`Verifying Razorpay payment: OrderID=${orderId}, PaymentID=${razorpayPaymentId}`);
    
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }
    
    console.log('Sending verification request to edge function');
    const verifyResponse = await fetch('https://nwisboqodsjdbnsiywax.supabase.co/functions/v1/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`
      },
      body: JSON.stringify({
        paymentId: orderId,
        provider: 'razorpay',
        razorpayPaymentId,
        razorpaySignature
      })
    });
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error(`Payment verification failed: ${errorText}`);
      }
      
      console.error('Payment verification failed:', errorData);
      throw new Error(errorData.error || 'Payment verification failed');
    }
    
    const result = await verifyResponse.json();
    console.log('Payment verification result:', result);
    return result;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

// Create a Razorpay order
export const createRazorpayOrder = async (
  paymentMethod: string,
  amount: number,
  booking: any
) => {
  try {
    console.log(`Creating ${paymentMethod} order for amount: ${amount}`);
    console.log('Booking details:', booking);
    
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      throw new Error('User not authenticated');
    }
    
    console.log('Sending order creation request to edge function');
    const response = await fetch('https://nwisboqodsjdbnsiywax.supabase.co/functions/v1/handle-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`
      },
      body: JSON.stringify({
        paymentMethod,
        amount,
        booking
      })
    });
    
    console.log(`Order creation response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`Order creation response: ${responseText}`);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON in order creation response: ${responseText}`);
    }
    
    if (!result.success) {
      console.error('Payment initialization failed:', result);
      throw new Error(result.error || 'Failed to initialize payment');
    }
    
    console.log('Payment initialization result:', result);
    return result;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

// Update booking status after successful payment
export const updateBookingAfterPayment = async (
  bookingId: string,
  paymentId: string
) => {
  try {
    console.log(`Updating booking ${bookingId} after payment ${paymentId}`);
    
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_id: paymentId,
        status: 'confirmed'  // Use 'status' instead of 'payment_status'
      })
      .eq('id', bookingId);
      
    if (error) {
      console.error('Booking update error:', error);
      throw new Error(`Failed to update booking status: ${error.message}`);
    }
    
    console.log(`Booking ${bookingId} updated successfully`);
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};
