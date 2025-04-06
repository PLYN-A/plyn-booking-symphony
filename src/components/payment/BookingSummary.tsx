
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CalendarDays, Scissors } from 'lucide-react';

interface BookingSummaryProps {
  salonName: string;
  services: any[];
  date: string;
  timeSlot: string;
  totalPrice: number;
  totalDuration: number;
  platformFee?: number;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  salonName,
  services,
  date,
  timeSlot,
  totalPrice,
  totalDuration,
  platformFee = 2, // Default platform fee is ₹2
}) => {
  // Calculate subtotal (without platform fee)
  const subtotal = totalPrice - platformFee;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{salonName}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <CalendarDays className="h-4 w-4" />
            <span>{date} at {timeSlot}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{totalDuration} minutes</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Selected Services</h4>
          <ul className="space-y-2">
            {services.map((service, index) => (
              <li key={index} className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-primary" />
                  <span>{service.name}</span>
                </div>
                <span>₹{service.price}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Platform Fee</span>
            <span>₹{platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold mt-2 pt-2 border-t">
            <span>Total</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;
