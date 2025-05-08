
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getTimeSlotsForDate, deleteSlot, createSlot } from '@/utils/slotUtils';
import { Loader2, Timer } from 'lucide-react';
import SlotExtender from './SlotExtender';

interface SlotManagerProps {
  merchantId: string;
  selectedDate?: Date;
  onDateChange?: React.Dispatch<React.SetStateAction<Date>>;
  onSlotsUpdated?: () => void;
}

const SlotManager: React.FC<SlotManagerProps> = ({ 
  merchantId,
  selectedDate = new Date(),
  onDateChange = () => {},
  onSlotsUpdated = () => {}
}) => {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(selectedDate);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // If the component receives a new selected date prop, update the internal state
  useEffect(() => {
    setInternalSelectedDate(selectedDate);
  }, [selectedDate]);

  // Fetch slots for the selected date
  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(internalSelectedDate, 'yyyy-MM-dd');
      console.log(`Fetching slots for date: ${dateStr} and merchant: ${merchantId}`);
      
      // Direct Supabase query rather than using the helper function
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('date', dateStr)
        .order('start_time');
        
      if (error) {
        console.error('Supabase error fetching slots:', error);
        throw error;
      }
      
      console.log(`Retrieved ${data?.length || 0} slots`);
      setSlots(data || []);
      
    } catch (error: any) {
      console.error('Error fetching slots:', error);
      setError('Failed to load time slots. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load time slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots when the selected date changes
  useEffect(() => {
    if (merchantId) {
      fetchSlots();
    }
  }, [internalSelectedDate, merchantId]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setInternalSelectedDate(date);
      onDateChange(date);
    }
  };

  // Add a new slot
  const handleAddSlot = async (startTime: string, endTime: string) => {
    try {
      const dateStr = format(internalSelectedDate, 'yyyy-MM-dd');
      await createSlot(merchantId, dateStr, startTime, endTime);
      toast({
        title: "Success",
        description: "Slot added successfully",
      });
      fetchSlots();
      onSlotsUpdated();
    } catch (error: any) {
      console.error('Error adding slot:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to add slot',
        variant: "destructive",
      });
    }
  };

  // Delete a slot
  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot(slotId);
      toast({
        title: "Success",
        description: "Slot deleted successfully",
      });
      fetchSlots();
      onSlotsUpdated();
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to delete slot',
        variant: "destructive",
      });
    }
  };

  // Handle slot extension
  const handleSlotExtended = () => {
    fetchSlots();
    onSlotsUpdated();
    toast({
      title: "Success",
      description: "Slot extended successfully",
    });
  };

  // Generate time slots for quick add
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 10) { // Changed from 30 to 10-minute intervals
        const startHour = hour;
        const startMinute = minute;
        const endHour = minute === 50 ? hour + 1 : hour; // Adjusted for 10-minute intervals
        const endMinute = minute === 50 ? 0 : minute + 10; // Adjusted for 10-minute intervals
        
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        slots.push({ startTime, endTime });
      }
    }
    return slots;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Manage Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="quickAdd">Quick Add</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <Calendar
                mode="single"
                selected={internalSelectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border mx-auto"
              />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">
                  Slots for {format(internalSelectedDate, 'PPPP')}
                </h3>
                
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-red-500">{error}</div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex flex-col space-y-1">
                        <Badge 
                          variant={slot.is_booked ? "secondary" : "outline"}
                          className="flex justify-between items-center px-3 py-1.5"
                        >
                          <span>{slot.start_time} - {slot.end_time}</span>
                          {!slot.is_booked && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 ml-1 rounded-full"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              ×
                            </Button>
                          )}
                        </Badge>
                        
                        {slot.is_booked && (
                          <div className="flex justify-end">
                            <SlotExtender
                              slotId={slot.id}
                              merchantId={merchantId}
                              date={format(internalSelectedDate, 'yyyy-MM-dd')}
                              currentEndTime={slot.end_time}
                              workerId={slot.worker_id}
                              onExtensionComplete={handleSlotExtended}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No slots available for this date.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="quickAdd" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quick add slots for {format(internalSelectedDate, 'PPPP')}:
            </p>
            
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {generateTimeSlots().map((slot, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleAddSlot(slot.startTime, slot.endTime)}
                >
                  {slot.startTime} - {slot.endTime}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SlotManager;
