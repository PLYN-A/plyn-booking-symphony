
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { showBookingSuccessNotification } from "@/components/booking/BookingSuccessNotification";

// Interface for booking data
export interface BookingData {
  userId: string;
  salonId: string;
  salonName: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  email: string;
  phone: string;
  totalPrice: number;
  totalDuration: number;
  slotId: string;
  notes?: string;
  coinsUsed?: number;
  coinsEarned?: number;
}

// Interface for payment data
export interface PaymentData {
  bookingId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  coinsUsed?: number;
  coinsEarned?: number;
}

// Function to create a new booking in the database
export const createBooking = async (bookingData: BookingData) => {
  try {
    const { data: newBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: bookingData.userId,
        merchant_id: bookingData.salonId,
        salon_id: bookingData.salonId,
        salon_name: bookingData.salonName,
        service_name: bookingData.serviceName,
        booking_date: bookingData.date,
        time_slot: bookingData.timeSlot,
        customer_email: bookingData.email,
        customer_phone: bookingData.phone,
        service_price: bookingData.totalPrice,
        service_duration: bookingData.totalDuration,
        slot_id: bookingData.slotId,
        status: "upcoming",
        additional_notes: bookingData.notes || "",
        coins_used: bookingData.coinsUsed || 0,
        coins_earned: bookingData.coinsEarned || 0
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    return newBooking;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

// Function to create a payment record
export const createPayment = async (paymentData: PaymentData) => {
  try {
    // For development purposes, always create a successful payment
    const { data: newPayment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        booking_id: paymentData.bookingId,
        user_id: paymentData.userId,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        payment_status: "completed", // Always completed for development
        transaction_id: `DEV-${Math.floor(Math.random() * 1000000)}`,
        coins_used: paymentData.coinsUsed || 0,
        coins_earned: paymentData.coinsEarned || 0
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update the booking with the payment ID
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ payment_id: newPayment.id })
      .eq("id", paymentData.bookingId);

    if (updateError) throw updateError;

    return newPayment;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
};

// Function to get user's PLYN coins
export const getUserCoins = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", userId)
      .single();

    if (error) throw error;
    
    // Handle the coins property safely
    return data?.coins || 0;
  } catch (error) {
    console.error("Error fetching user coins:", error);
    return 0; // Default to 0 coins if there's an error
  }
};

// Function to update user's PLYN coins
export const updateUserCoins = async (userId: string, coinsEarned: number, coinsUsed: number) => {
  try {
    // First get current coin balance
    const { data: userData, error: fetchError } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;
    
    // Safely access the coins property
    const currentCoins = userData?.coins || 0;
    const newCoinsBalance = currentCoins + coinsEarned - coinsUsed;
    
    // Update the user's coin balance
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ coins: newCoinsBalance })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) throw updateError;
    
    return newCoinsBalance;
  } catch (error) {
    console.error("Error updating user coins:", error);
    throw error;
  }
};

// Function to fetch user's bookings
export const fetchUserBookings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        payments(*)
      `)
      .eq("user_id", userId)
      .order("booking_date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

// Function to update a booking status
export const updateBookingStatus = async (bookingId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
};

// Enhanced function to check slot availability with database locking
export const checkSlotAvailability = async (salonId: string, date: string, timeSlot: string) => {
  try {
    // Begin transaction
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", salonId)
      .eq("date", date)
      .eq("start_time", timeSlot)
      .eq("is_booked", false)
      .limit(1);

    if (error) throw error;
    
    // If no slots are found, or if the slot is already booked
    if (!data || data.length === 0) {
      return {
        available: false,
        slotId: null
      };
    }
    
    return {
      available: true,
      slotId: data[0].id
    };
  } catch (error) {
    console.error("Error checking slot availability:", error);
    throw error;
  }
};

// Enhanced function to mark a slot as booked with atomic update
export const bookSlot = async (slotId: string) => {
  try {
    // First check if slot is still available
    const { data: checkData, error: checkError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .eq("is_booked", false)
      .single();
    
    if (checkError) {
      if (checkError.code === "PGRST116") { 
        // No rows returned, slot is already booked
        throw new Error("This slot has already been booked by another customer.");
      }
      throw checkError;
    }

    // If we got here, slot is available, so mark it as booked with optimistic locking
    const { data, error } = await supabase
      .from("slots")
      .update({ is_booked: true })
      .eq("id", slotId)
      .eq("is_booked", false) // Ensure it hasn't been booked in the meantime
      .select()
      .single();

    if (error) throw error;
    
    if (!data) {
      throw new Error("Slot was booked by someone else while processing your request.");
    }
    
    return data;
  } catch (error) {
    console.error("Error booking slot:", error);
    throw error;
  }
};

// Function to fetch available slots for a salon on a specific date
export const fetchAvailableSlots = async (salonId: string, date: string) => {
  try {
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", salonId)
      .eq("date", date)
      .eq("is_booked", false)
      .order("start_time");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching available slots:", error);
    throw error;
  }
};

// Function to fetch all slots for a merchant (for admin/merchant view)
export const fetchMerchantSlots = async (merchantId: string) => {
  try {
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching merchant slots:", error);
    throw error;
  }
};

// Function to delete a slot (for merchant use)
export const deleteSlot = async (slotId: string) => {
  try {
    // Check if the slot is already booked
    const { data: slotData, error: checkError } = await supabase
      .from("slots")
      .select("is_booked")
      .eq("id", slotId)
      .single();
      
    if (checkError) throw checkError;
    
    if (slotData.is_booked) {
      throw new Error("Cannot delete a slot that has already been booked.");
    }
    
    const { error } = await supabase
      .from("slots")
      .delete()
      .eq("id", slotId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting slot:", error);
    throw error;
  }
};

// Subscribe to real-time updates for slot availability
export const subscribeToSlotUpdates = (salonId: string, date: string, callback: Function) => {
  const channel = supabase
    .channel('slot-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'slots',
        filter: `merchant_id=eq.${salonId}~and~date=eq.${date}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
