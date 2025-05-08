
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Timer, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSlotExtenderProps {
  bookingId: string;
  currentEndTime: string;
  date: string;
  onExtensionComplete?: () => void;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

const UserSlotExtender: React.FC<UserSlotExtenderProps> = ({
  bookingId,
  currentEndTime,
  date,
  onExtensionComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [extensionOptions, setExtensionOptions] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch booking details when opened
  useEffect(() => {
    if (isOpen) {
      fetchBookingDetails();
      generateExtensionOptions();
    }
  }, [isOpen]);
  
  // Fetch available services when merchant ID is available
  useEffect(() => {
    if (merchantId) {
      fetchServices();
    }
  }, [merchantId]);
  
  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      
      // Get booking info
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('merchant_id, worker_id, slot_id')
        .eq('id', bookingId)
        .single();
        
      if (bookingError) throw bookingError;
      
      if (booking) {
        setMerchantId(booking.merchant_id);
        setWorkerId(booking.worker_id);
        setSlotId(booking.slot_id);
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      toast({
        title: "Error",
        description: "Could not load booking details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchServices = async () => {
    try {
      const { data: serviceData, error } = await supabase
        .from('services')
        .select('id, name, price, duration')
        .eq('merchant_id', merchantId);
        
      if (error) throw error;
      
      if (serviceData) {
        setServices(serviceData);
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
    }
  };
  
  const generateExtensionOptions = () => {
    const options: string[] = [];
    const [hours, minutes] = currentEndTime.split(':').map(Number);
    
    let currentTimeObj = new Date();
    currentTimeObj.setHours(hours, minutes, 0, 0);
    
    // Generate 4 options in 15 minute increments
    for (let i = 1; i <= 4; i++) {
      const newTimeObj = new Date(currentTimeObj);
      newTimeObj.setMinutes(newTimeObj.getMinutes() + (15 * i));
      
      // Format as HH:MM
      const newHours = newTimeObj.getHours().toString().padStart(2, '0');
      const newMinutes = newTimeObj.getMinutes().toString().padStart(2, '0');
      const newTimeStr = `${newHours}:${newMinutes}`;
      
      options.push(newTimeStr);
    }
    
    setExtensionOptions(options);
  };
  
  const handleTimeSelection = async (time: string) => {
    setSelectedTime(time);
    setIsChecking(true);
    setIsAvailable(null);
    
    try {
      // Check if there are any conflicts for worker's schedule
      if (workerId && slotId) {
        const { data: conflictingSlots, error } = await supabase
          .from('slots')
          .select('id')
          .eq('worker_id', workerId)
          .eq('date', date)
          .neq('id', slotId)
          .gt('start_time', currentEndTime)
          .lt('start_time', time);
          
        if (error) throw error;
        
        setIsAvailable(conflictingSlots.length === 0);
      } else {
        setIsAvailable(true);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleServiceSelection = (serviceId: string) => {
    setSelectedService(serviceId);
  };
  
  const handleExtend = async () => {
    if (!selectedTime || !isAvailable || !slotId) return;
    
    setIsLoading(true);
    
    try {
      // 1. Get current slot details
      const { data: currentSlot, error: slotError } = await supabase
        .from('slots')
        .select('start_time, service_name, service_price, service_duration')
        .eq('id', slotId)
        .single();
        
      if (slotError) throw slotError;
      
      // 2. Calculate the new duration in minutes
      const startParts = currentSlot.start_time.split(':').map(Number);
      const endParts = selectedTime.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      const durationMinutes = endMinutes - startMinutes;
      
      // 3. Prepare service information for the extension
      let serviceName = currentSlot.service_name;
      let servicePrice = currentSlot.service_price;
      
      // If a new service is selected, get its details
      if (selectedService) {
        const selectedServiceDetails = services.find(s => s.id === selectedService);
        if (selectedServiceDetails) {
          serviceName = `${currentSlot.service_name} + ${selectedServiceDetails.name}`;
          servicePrice = Number(currentSlot.service_price) + Number(selectedServiceDetails.price);
        }
      }
      
      // 4. Update the slot with the new end time and duration
      const { error: updateError } = await supabase
        .from('slots')
        .update({
          end_time: selectedTime,
          service_duration: durationMinutes,
          service_name: serviceName,
          service_price: servicePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);
        
      if (updateError) throw updateError;
      
      // 5. Update the booking's service details
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          service_duration: durationMinutes,
          service_name: serviceName,
          service_price: servicePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
        
      if (bookingUpdateError) throw bookingUpdateError;
      
      toast({
        title: "Slot Extended",
        description: `Your appointment has been extended to end at ${selectedTime}`,
      });
      
      setIsOpen(false);
      
      if (onExtensionComplete) {
        onExtensionComplete();
      }
    } catch (error: any) {
      console.error('Error extending slot:', error);
      toast({
        title: "Failed to extend slot",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Extend Booking
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Your Appointment</DialogTitle>
          <DialogDescription>
            Choose how much longer you need and add additional services if desired.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Current End Time:</p>
            <Badge variant="outline" className="text-md">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {currentEndTime}
            </Badge>
          </div>
          
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Select New End Time:</p>
            <div className="grid grid-cols-2 gap-2">
              {extensionOptions.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                  onClick={() => handleTimeSelection(time)}
                >
                  <Timer className="h-4 w-4 mr-2" />
                  {time}
                </Button>
              ))}
            </div>
            
            {isChecking && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Checking availability...</span>
              </div>
            )}
            
            {isAvailable === false && selectedTime && (
              <p className="text-red-500 text-sm mt-2">
                This time conflicts with another appointment.
              </p>
            )}
            
            {isAvailable && selectedTime && (
              <p className="text-green-500 text-sm mt-2">
                This time is available for extension.
              </p>
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Add a service for the extended time (optional):</p>
            {services.length > 0 ? (
              <Select value={selectedService || undefined} onValueChange={handleServiceSelection}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${service.price} ({service.duration} min)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">Loading available services...</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline"  
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExtend}
            disabled={!selectedTime || isLoading || !isAvailable}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Extending...
              </>
            ) : (
              'Extend Booking'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSlotExtender;
