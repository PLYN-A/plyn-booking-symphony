import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Phone, Mail, Star, ChevronLeft } from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';
import PageTransition from '@/components/transitions/PageTransition';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useFavorites } from '@/hooks/useFavorites';

const SalonDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  
  useEffect(() => {
    if (id) {
      fetchSalonDetails();
    }
  }, [id]);
  
  const fetchSalonDetails = async () => {
    try {
      setIsLoading(true);
      
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', id)
        .single();
        
      if (merchantError) throw merchantError;
      
      setSalon(merchantData);
      
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('merchant_id', id);
        
      if (servicesError) throw servicesError;
      
      setServices(servicesData || []);
    } catch (error: any) {
      console.error('Error fetching salon details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load salon details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleServiceSelect = (service: any) => {
    const serviceIndex = selectedServices.findIndex(s => s.id === service.id);
    
    if (serviceIndex >= 0) {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      setSelectedServices(prev => [...prev, service]);
    }
  };
  
  const handleProceedToBooking = () => {
    if (selectedServices.length === 0) {
      toast({
        title: 'No services selected',
        description: 'Please select at least one service to book.',
        variant: 'destructive',
      });
      return;
    }
    
    setActiveTab('booking');
  };
  
  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.price || 0), 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration || 0), 0);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
          <p>Loading salon details...</p>
        </div>
      </div>
    );
  }
  
  if (!salon) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Salon Not Found</h1>
        <p className="mb-6">The salon you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }
  
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{salon.business_name}</CardTitle>
                      <CardDescription className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {salon.business_address}
                      </CardDescription>
                    </div>
                    <FavoriteButton
                      isFavorite={isFavorite(salon.id)}
                      onToggle={() => toggleFavorite(salon.id)}
                      size="md"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{salon.business_phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{salon.business_email}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      <span>4.8 (120 reviews)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <div className="mt-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="booking" disabled={selectedServices.length === 0}>Booking</TabsTrigger>
                </TabsList>
                
                <TabsContent value="services" className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Available Services</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <Card 
                          key={service.id} 
                          className={`overflow-hidden transition-colors ${
                            selectedServices.some(s => s.id === service.id) 
                              ? 'border-primary bg-primary/5' 
                              : ''
                          }`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{service.name}</CardTitle>
                                <CardDescription className="mt-1">{service.description}</CardDescription>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold">${service.price}</span>
                                <p className="text-sm text-muted-foreground">{service.duration} min</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardFooter className="pt-2">
                            <Button 
                              onClick={() => handleServiceSelect(service)}
                              variant={selectedServices.some(s => s.id === service.id) ? "default" : "outline"}
                              className="w-full"
                            >
                              {selectedServices.some(s => s.id === service.id) ? 'Selected' : 'Select'}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No services available at the moment.</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedServices.length > 0 && (
                    <div className="mt-6">
                      <Card className="bg-primary/5">
                        <CardHeader>
                          <CardTitle>Selected Services</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {selectedServices.map(service => (
                              <li key={service.id} className="flex justify-between">
                                <span>{service.name}</span>
                                <span>${service.price}</span>
                              </li>
                            ))}
                            <li className="flex justify-between font-bold border-t pt-2 mt-2">
                              <span>Total</span>
                              <span>${totalPrice}</span>
                            </li>
                            <li className="flex justify-between text-sm text-muted-foreground">
                              <span>Estimated Duration</span>
                              <span>{totalDuration} minutes</span>
                            </li>
                          </ul>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full" onClick={handleProceedToBooking}>
                            Proceed to Booking
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="booking" className="mt-6">
                  {selectedServices.length > 0 && salon && (
                    <BookingForm
                      salonId={salon.id}
                      salonName={salon.business_name}
                      selectedServices={selectedServices}
                      totalPrice={totalPrice}
                      totalDuration={totalDuration}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>About {salon.business_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {salon.business_name} is a premier salon offering a wide range of beauty and wellness services. 
                  Our experienced professionals are dedicated to providing exceptional service in a relaxing environment.
                </p>
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 5:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Map view coming soon</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {salon.business_address}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SalonDetails;
