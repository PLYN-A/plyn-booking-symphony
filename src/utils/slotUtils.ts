
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, addDays, parseISO, subDays, isBefore } from "date-fns";
import { TimeSlot, SlotAvailability } from "@/types/admin";

// Generate time slots for a salon
export const generateSalonTimeSlots = async (salonId: string, date: Date) => {
  try {
    // Format the date for database queries
    const formattedDate = format(date, "yyyy-MM-dd");
    
    // First check if slots already exist for this date and salon
    const { data: existingSlots, error: checkError } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", salonId)
      .eq("date", formattedDate);
    
    if (checkError) throw checkError;
    
    // If slots already exist, return them
    if (existingSlots && existingSlots.length > 0) {
      console.log(`Found ${existingSlots.length} existing slots for ${formattedDate}`);
      return existingSlots;
    }
    
    console.log(`Generating new slots for ${formattedDate}`);
    
    // Get service durations from this merchant to create appropriate slots
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('duration')
      .eq('merchant_id', salonId);
      
    // Get unique service durations, defaulting to 15, 30, 45, 60 minutes if none found
    const serviceDurations = serviceData && serviceData.length > 0
      ? [...new Set(serviceData.map(s => s.duration))]
      : [15, 30, 45, 60];
    
    // Get smallest duration to use as increment
    const minDuration = Math.min(...serviceDurations);
    
    // Default business hours
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    let slots = [];
    let currentTime = new Date(date);
    currentTime.setHours(startHour, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);
    
    while (currentTime < endTime) {
      const startTimeStr = format(currentTime, "HH:mm");
      
      // Create slots for each service duration
      for (const duration of serviceDurations) {
        const endTimeObj = addMinutes(currentTime, duration);
        
        // Only create slots that end within business hours
        if (endTimeObj <= endTime) {
          const endTimeStr = format(endTimeObj, "HH:mm");
          
          // Randomly mark some slots as booked for testing purposes
          // But don't book slots in the future
          const isInPast = isBefore(currentTime, new Date());
          const randomBooked = isInPast || Math.random() < 0.1; // 10% chance of being booked for future slots
          
          slots.push({
            merchant_id: salonId,
            date: formattedDate,
            start_time: startTimeStr,
            end_time: endTimeStr,
            is_booked: randomBooked,
            service_duration: duration
          });
        }
      }
      
      // Move to the next time increment using minDuration
      currentTime = addMinutes(currentTime, minDuration);
    }
    
    // Insert the slots into the database
    const { data: insertedSlots, error: insertError } = await supabase
      .from("slots")
      .insert(slots)
      .select();
    
    if (insertError) throw insertError;
    
    console.log(`Created ${insertedSlots.length} new slots for ${formattedDate}`);
    return insertedSlots;
  } catch (error) {
    console.error("Error generating salon time slots:", error);
    throw error;
  }
};

// Get available time slots for a salon
export const getAvailableTimeSlots = async (salonId: string, date: Date | string) => {
  try {
    // Convert string date to Date object if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Ensure slots exist for this date
    await generateSalonTimeSlots(salonId, dateObj);
    
    // Format the date for database queries
    const formattedDate = format(dateObj, "yyyy-MM-dd");
    
    // Get available slots
    const { data: availableSlots, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", salonId)
      .eq("date", formattedDate)
      .eq("is_booked", false)
      .order("start_time");
    
    if (error) throw error;
    
    console.log(`Found ${availableSlots?.length || 0} available slots for ${formattedDate}`);
    return availableSlots || [];
  } catch (error) {
    console.error("Error getting available time slots:", error);
    throw error;
  }
};

// Format time slots for display
export const formatSlotsForDisplay = (slots: any[]) => {
  return slots.map(slot => ({
    id: slot.id,
    time: slot.start_time,
    available: !slot.is_booked
  }));
};

// Add default data for development purposes
export const seedDefaultData = async () => {
  try {
    // Check if default merchants exist
    const { data: existingMerchants, error: checkError } = await supabase
      .from("merchants")
      .select("id");
    
    if (checkError) throw checkError;
    
    // If default merchants already exist, don't seed
    if (existingMerchants && existingMerchants.length > 0) {
      console.log("Default merchants already exist, skipping merchant seeding");
      
      // Even if merchants exist, make sure we generate slots for testing
      await generateSlotsForMerchants(existingMerchants);
      
      return { success: true, message: "Default data already exists" };
    }
    
    // Add default salons/merchants
    const defaultMerchants = [
      {
        id: "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
        business_name: "Men's Style Barber Shop",
        business_address: "123 Main Street, Downtown",
        business_phone: "555-123-4567",
        business_email: "info@mensstyle.com",
        service_category: "men"
      },
      {
        id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        business_name: "Glamour Women's Salon",
        business_address: "456 Fashion Avenue, Uptown",
        business_phone: "555-987-6543",
        business_email: "info@glamoursalon.com",
        service_category: "women"
      }
    ];
    
    const { error: merchantError } = await supabase
      .from("merchants")
      .insert(defaultMerchants);
    
    if (merchantError) throw merchantError;
    
    console.log("Default merchants created successfully");
    
    // Generate slots for these merchants
    await generateSlotsForMerchants(defaultMerchants);
    
    // Create some test bookings
    await createTestBookings(defaultMerchants);
    
    return { success: true, message: "Default data seeded successfully" };
  } catch (error) {
    console.error("Error seeding default data:", error);
    return { success: false, message: "Error seeding default data", error };
  }
};

// Helper function to generate slots for merchants
async function generateSlotsForMerchants(merchants: any[]) {
  const today = new Date();
  
  for (const merchant of merchants) {
    // Generate slots for the previous 3 days (some will be in the past) and the next 14 days
    for (let i = -3; i < 14; i++) {
      const date = addDays(today, i);
      await generateSalonTimeSlots(merchant.id, date);
    }
    console.log(`Generated slots for merchant: ${merchant.business_name || merchant.id}`);
  }
}

// Create some test bookings for development
async function createTestBookings(merchants: any[]) {
  try {
    // First check if we already have test bookings
    const { data: existingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("id")
      .limit(1);
    
    if (checkError) throw checkError;
    
    // If bookings exist, skip creating test bookings
    if (existingBookings && existingBookings.length > 0) {
      console.log("Test bookings already exist, skipping");
      return;
    }
    
    // For each merchant, create a few test bookings
    for (const merchant of merchants) {
      // Get some available slots
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const dayAfter = addDays(today, 2);
      
      const dates = [today, tomorrow, dayAfter];
      
      for (const date of dates) {
        // Get available slots for this date
        const { data: slots } = await supabase
          .from("slots")
          .select("*")
          .eq("merchant_id", merchant.id)
          .eq("date", format(date, "yyyy-MM-dd"))
          .eq("is_booked", false)
          .limit(3);
        
        if (!slots || slots.length === 0) continue;
        
        // Book one slot for each date
        const slot = slots[0];
        
        // Mark this slot as booked
        await supabase
          .from("slots")
          .update({ is_booked: true })
          .eq("id", slot.id);
        
        // Create a test booking
        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          .insert({
            user_id: "00000000-0000-0000-0000-000000000000", // Placeholder user ID
            merchant_id: merchant.id,
            salon_id: merchant.id,
            salon_name: merchant.business_name,
            service_name: merchant.service_category === "men" ? "Men's Haircut" : "Women's Cut & Style",
            booking_date: format(date, "yyyy-MM-dd"),
            time_slot: slot.start_time,
            customer_email: "test@example.com",
            customer_phone: "555-555-5555",
            service_price: merchant.service_category === "men" ? 35 : 55,
            service_duration: 30,
            slot_id: slot.id,
            status: "upcoming",
            additional_notes: "Test booking created automatically"
          })
          .select()
          .single();
        
        if (bookingError) throw bookingError;
        
        console.log(`Created test booking for ${merchant.business_name} on ${format(date, "yyyy-MM-dd")} at ${slot.start_time}`);
      }
    }
  } catch (error) {
    console.error("Error creating test bookings:", error);
    throw error;
  }
}

// Helper function to convert time string to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Get slot availability summary by date
export const getSlotAvailabilitySummary = async (
  merchantId: string, 
  startDate: Date, 
  endDate: Date
): Promise<SlotAvailability[]> => {
  try {
    const formattedStartDate = format(startDate, "yyyy-MM-dd");
    const formattedEndDate = format(endDate, "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("slots")
      .select("date, is_booked")
      .eq("merchant_id", merchantId)
      .gte("date", formattedStartDate)
      .lte("date", formattedEndDate);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Group by date and count available/booked slots
    const dateMap = new Map<string, { available: number; booked: number }>();
    
    data.forEach(slot => {
      if (!dateMap.has(slot.date)) {
        dateMap.set(slot.date, { available: 0, booked: 0 });
      }
      
      const dateStats = dateMap.get(slot.date)!;
      if (slot.is_booked) {
        dateStats.booked += 1;
      } else {
        dateStats.available += 1;
      }
    });
    
    // Convert map to array
    const result: SlotAvailability[] = Array.from(dateMap.entries()).map(([date, slots]) => ({
      date,
      slots
    }));
    
    // Sort by date
    result.sort((a, b) => a.date.localeCompare(b.date));
    
    return result;
  } catch (error) {
    console.error("Error getting slot availability summary:", error);
    throw error;
  }
};

// Function to find available time slots
export const findAvailableTimeSlots = async (merchantId: string, date: string): Promise<any[]> => {
  try {
    // Get available slots
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .eq("merchant_id", merchantId)
      .eq("date", date)
      .eq("is_booked", false)
      .order("start_time");
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error finding available time slots:", error);
    throw error;
  }
};
