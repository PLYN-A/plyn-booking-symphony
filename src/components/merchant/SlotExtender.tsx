
import React, { useState } from 'react';
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
import { Calendar as CalendarIcon, Timer } from 'lucide-react';
import { canExtendSlot, extendSlot, generateExtensionOptions } from '@/utils/slotExtensionUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SlotExtenderProps {
  slotId: string;
  merchantId: string;
  date: string;
  currentEndTime: string;
  workerId: string | null;
  onExtensionComplete?: () => void;
}

const SlotExtender: React.FC<SlotExtenderProps> = ({
  slotId,
  merchantId,
  date,
  currentEndTime,
  workerId,
  onExtensionComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  const extensionOptions = generateExtensionOptions(currentEndTime);
  
  const handleTimeSelection = async (time: string) => {
    setSelectedTime(time);
    setIsChecking(true);
    setIsAvailable(null);
    
    try {
      const canExtend = await canExtendSlot(
        slotId,
        merchantId,
        date,
        workerId,
        time
      );
      
      setIsAvailable(canExtend);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleExtend = async () => {
    if (!selectedTime || !isAvailable) return;
    
    setIsLoading(true);
    
    try {
      await extendSlot(slotId, selectedTime);
      
      toast({
        title: "Slot extended",
        description: `The slot has been extended to end at ${selectedTime}`,
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
          <Timer className="h-4 w-4 mr-1" />
          Extend Slot
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Appointment Slot</DialogTitle>
          <DialogDescription>
            Extend the current slot to a later end time.
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
          
          <div>
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
              'Extend Slot'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SlotExtender;
