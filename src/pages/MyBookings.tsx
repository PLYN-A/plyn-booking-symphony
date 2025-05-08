
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchUserBookings, cancelBookingAndRefund } from '@/utils/bookingUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ChevronLeft, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageTransition from '@/components/transitions/PageTransition';
import UserSlotExtender from '@/components/booking/UserSlotExtender';

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

  // Handle booking extension completion
  const handleExtensionComplete = async () => {
    if (!user) return;
    
    try {
      // Refresh bookings to show updated information
      const updatedBookings = await fetchUserBookings(user.id);
      setBookings(updatedBookings);
      
      toast({
        title: 'Booking Extended',
        description: 'Your booking has been successfully extended.',
      });
    } catch (error: any) {
      console.error('Error refreshing bookings:', error);
    }
  };

  // Helper function to determine which tab a booking belongs to
  const getBookingTab = (status: string) => {
    if (status === 'completed') return 'completed';
    if (['cancelled', 'missed'].includes(status)) return 'cancelled';
    return 'upcoming'; // pending and confirmed are considered upcoming
  };

  const filteredBookings = bookings.filter((booking) => {
    return getBookingTab(booking.status) === selectedTab;
  });

  // Helper function to get badge styling based on status
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400';
      case 'missed':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400';
    }
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">My Bookings</h1>
        </div>

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
                            className={`mt-2 md:mt-0 ${getStatusBadgeStyle(booking.status)}`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
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
                        
                        {(['pending', 'confirmed'].includes(booking.status)) && (
                          <div className="mt-4 flex justify-end gap-2">
                            <UserSlotExtender 
                              bookingId={booking.id}
                              currentEndTime={booking.end_time || "18:00"} // Fallback if end time not available
                              date={booking.booking_date}
                              onExtensionComplete={handleExtensionComplete}
                            />
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
