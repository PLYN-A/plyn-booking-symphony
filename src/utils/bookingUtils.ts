import { supabase } from '@/integrations/supabase/client';

export const fetchUserBookings = async (userId: string) => {
  try {
    // First get the bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, payments(payment_status)')
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) throw error;

    if (!bookings || bookings.length === 0) return [];

    // For each booking, get the slot to get the end time
    const bookingsWithEndTimes = await Promise.all(bookings.map(async (booking) => {
      if (booking.slot_id) {
        const { data: slotData } = await supabase
          .from('slots')
          .select('end_time')
          .eq('id', booking.slot_id)
          .single();

        return {
          ...booking,
          end_time: slotData?.end_time || null
        };
      }
      return booking;
    }));

    return bookingsWithEndTimes;
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
};

export const cancelBookingAndRefund = async (bookingId: string) => {
  try {
    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id, service_price, coins_used')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      throw new Error('Failed to fetch booking details.');
    }

    if (!booking) {
      throw new Error('Booking not found.');
    }

    // Cancel the booking
    const { error: cancelError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (cancelError) {
      console.error('Error cancelling booking:', cancelError);
      throw new Error('Failed to cancel the booking.');
    }

    // Refund PLYN coins if used
    if (booking.coins_used && booking.coins_used > 0) {
      const refundAmount = booking.coins_used;

      // Get the current user's profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', booking.user_id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to fetch user profile.');
      }

      if (!userProfile) {
        throw new Error('User profile not found.');
      }

      // Update the user's coin balance
      const newCoinBalance = (userProfile.coins || 0) + refundAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: newCoinBalance })
        .eq('id', booking.user_id);

      if (updateError) {
        console.error('Error updating user coins:', updateError);
        throw new Error('Failed to refund PLYN coins.');
      }
    }

    return { success: true, message: 'Booking cancelled and coins refunded successfully.' };
  } catch (error: any) {
    console.error('Error cancelling booking and refunding:', error);
    return { success: false, message: error.message || 'Failed to cancel booking and refund.' };
  }
};
