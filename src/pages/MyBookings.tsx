
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchUserBookings, cancelBookingAndRefund } from '@/utils/bookingUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { X, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/transitions/PageTransition';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const { toast } = useToast();

  useEffect(() => {
    const loadBookings = async () => {
      // Check if user is authenticated
      if (loading) return;
      if (!user) {
        navigate('/auth?redirect=bookings');
        return;
      }

      // Fetch user bookings
      try {
        setIsLoading(true);
        const userBookings = await fetchUserBookings(user.id);
        setBookings(userBookings);
      } catch (error: any) {
        console.error('Error loading bookings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your bookings. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, [user, loading, navigate, toast]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return;
    
    try {
      await cancelBookingAndRefund(bookingId);
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully and any used PLYN coins have been refunded.',
      });
      
      // Refresh bookings
      const updatedBookings = await fetchUserBookings(user.id);
      setBookings(updatedBookings);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel your booking. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (selectedTab === 'upcoming') {
      return booking.status === 'upcoming';
    } else if (selectedTab === 'completed') {
      return booking.status === 'completed';
    } else if (selectedTab === 'cancelled') {
      return booking.status === 'cancelled' || booking.status === 'missed';
    }
    return true;
  });

  return (
    <PageTransition>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        <Tabs defaultValue="upcoming" onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled/Missed</TabsTrigger>
          </TabsList>

          {['upcoming', 'completed', 'cancelled'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
                </div>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-semibold">{booking.salon_name}</h2>
                            <p className="text-muted-foreground">{booking.service_name}</p>
                          </div>
                          <Badge
                            className={`mt-2 md:mt-0 ${booking.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 
                            booking.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400' : 
                            booking.status === 'missed' ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400' :
                            'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}
                          >
                            {booking.status === 'missed' ? 'Missed' : booking.status}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-between">
                          <div className="flex items-center mb-4 md:mb-0">
                            <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{booking.booking_date}</p>
                              <p className="text-sm text-muted-foreground">{booking.time_slot}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Price</p>
                              <p className="font-medium">${booking.service_price}</p>
                            </div>
                          </div>
                        </div>
                        
                        {booking.status === 'upcoming' && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel Booking
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No {tab} bookings found.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default MyBookings;
