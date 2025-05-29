
import { supabase } from '@/integrations/supabase/client';
import { createSlot } from './slotUtils';

interface SlotAvailabilityResult {
  available: boolean;
  slotId?: string;
  workerId?: string;
  workerName?: string;
}

export const checkSlotAvailability = async (
  salonId: string,
  date: string,
  time: string,
  duration: number
): Promise<SlotAvailabilityResult> => {
  try {
    console.log(`Checking slot availability for salon ${salonId} on ${date} at ${time}`);

    // Check if there's an existing available slot
    const { data: existingSlots, error } = await supabase
      .from('slots')
      .select('*')
      .eq('salon_id', salonId)
      .eq('date', date)
      .eq('start_time', time)
      .eq('is_booked', false);

    if (error) {
      console.error('Error checking existing slots:', error);
      throw error;
    }

    if (existingSlots && existingSlots.length > 0) {
      const slot = existingSlots[0];
      console.log(`Found existing available slot: ${slot.id}`);
      return {
        available: true,
        slotId: slot.id,
        workerId: slot.worker_id,
        workerName: 'Available Worker'
      };
    }

    // If no existing slot, try to create a new one
    console.log('No existing slot found, attempting to create new slot');
    const newSlotId = await createSlot(salonId, date, time, duration);
    
    if (newSlotId) {
      console.log(`Created new slot: ${newSlotId}`);
      return {
        available: true,
        slotId: newSlotId,
        workerId: undefined,
        workerName: 'Available Worker'
      };
    }

    console.log('No slot could be created');
    return { available: false };

  } catch (error) {
    console.error('Error in checkSlotAvailability:', error);
    return { available: false };
  }
};

export const bookSlot = async (slotId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('slots')
      .update({ is_booked: true })
      .eq('id', slotId);

    if (error) {
      console.error('Error booking slot:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in bookSlot:', error);
    return false;
  }
};
