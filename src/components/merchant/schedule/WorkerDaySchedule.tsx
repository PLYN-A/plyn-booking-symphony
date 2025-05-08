
import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Worker } from '@/types/admin';
import SlotExtender from '../SlotExtender';

interface WorkerDayScheduleProps {
  worker: Worker;
  date: Date;
  appointments: any[];
  loading: boolean;
  onReallocate?: (appointment: any) => void;
}

const WorkerDaySchedule: React.FC<WorkerDayScheduleProps> = ({
  worker,
  date,
  appointments,
  loading,
  onReallocate
}) => {
  const [isReallocateOpen, setIsReallocateOpen] = useState(false);
  
  // Handler for slot extension completion
  const handleSlotExtended = () => {
    // This would typically refresh the worker's schedule data
    // but we'll rely on external refresh for now
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          {worker.name}
          <Badge variant="outline">{worker.specialty || 'Stylist'}</Badge>
        </CardTitle>
        <div className="text-sm text-muted-foreground flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {format(date, 'EEEE, MMMM d')}
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="border border-border">
                <CardContent className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {appointment.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.service_name}
                      </p>
                    </div>
                    <Badge variant={
                      appointment.status === 'confirmed' ? 'default' : 
                      appointment.status === 'cancelled' ? 'destructive' : 'secondary'
                    }>
                      {appointment.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center mt-2 text-sm">
                    <Timer className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span>{appointment.time_slot} - {appointment.end_time}</span>
                  </div>
                </CardContent>
                
                <CardFooter className="py-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onReallocate && onReallocate(appointment)}
                  >
                    Reallocate
                  </Button>
                  
                  <SlotExtender
                    slotId={appointment.id}
                    merchantId={worker.merchant_id}
                    date={format(date, 'yyyy-MM-dd')}
                    currentEndTime={appointment.end_time}
                    workerId={worker.id}
                    onExtensionComplete={handleSlotExtended}
                  />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No appointments scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkerDaySchedule;
