import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelected: (lat: string, lng: string, address?: string) => void;
  initialAddress?: string;
  initialLat?: string;
  initialLng?: string;
}

const MapLocationDialog: React.FC<MapLocationDialogProps> = ({
  open,
  onOpenChange,
  onLocationSelected,
  initialAddress,
  initialLat,
  initialLng
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Google Maps references
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!open) return;
    
    const loadGoogleMapsScript = () => {
      if (window.google?.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      script.onerror = () => {
        toast({
          title: "Error loading Google Maps",
          description: "Failed to load Google Maps. Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      };
      
      document.head.appendChild(script);
    };
    
    loadGoogleMapsScript();
    // Clean up function
    return () => {
      // Cleanup if needed
    };
  }, [open]);

  // Initialize map with initial location
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !window.google?.maps) return;
    
    setLoading(true);
    
    try {
      let initialPosition: google.maps.LatLngLiteral = { lat: 20.5937, lng: 78.9629 }; // Default to center of India
      
      // If we have initial lat/lng, use those
      if (initialLat && initialLng) {
        const lat = parseFloat(initialLat);
        const lng = parseFloat(initialLng);
        initialPosition = { lat, lng };
        setSelectedLocation({ lat, lng });
      }
      // Otherwise try to geocode the initial address
      else if (initialAddress) {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: initialAddress }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                resolve(results);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            });
          });
          
          if (result[0]?.geometry?.location) {
            const location = result[0].geometry.location;
            initialPosition = { lat: location.lat(), lng: location.lng() };
            setSelectedLocation({ lat: location.lat(), lng: location.lng() });
            setAddress(result[0].formatted_address || initialAddress);
          }
        } catch (error) {
          console.error('Error geocoding address:', error);
        }
      }
      
      // Create the map
      const mapOptions: google.maps.MapOptions = {
        center: initialPosition,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      };
      
      const map = new google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;
      
      // Add marker
      const marker = new google.maps.Marker({
        position: initialPosition,
        map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Salon Location'
      });
      markerRef.current = marker;
      
      // Handle map click to move marker
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng && markerRef.current) {
          markerRef.current.setPosition(e.latLng);
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setSelectedLocation({ lat, lng });
          reverseGeocode(lat, lng);
        }
      });
      
      // Handle marker drag
      marker.addListener('dragend', () => {
        if (markerRef.current) {
          const position = markerRef.current.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            setSelectedLocation({ lat, lng });
            reverseGeocode(lat, lng);
          }
        }
      });
      
      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Error loading map",
        description: "Failed to load the location map. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [initialAddress, initialLat, initialLng, toast]);
  
  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google?.maps) return;
    
    try {
      const geocoder = new google.maps.Geocoder();
      const latlng = { lat, lng };
      
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          setAddress(results[0].formatted_address);
        } else {
          console.error('Reverse geocoding failed:', status);
        }
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  // Get user's current location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation || !googleMapRef.current || !markerRef.current) {
      toast({
        title: "Location not supported",
        description: "Your browser does not support geolocation or map is not initialized.",
        variant: "destructive",
      });
      return;
    }

    setLocatingUser(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latLng = new google.maps.LatLng(latitude, longitude);
        
        // Center map on user's location
        if (googleMapRef.current) {
          googleMapRef.current.setCenter(latLng);
        }
        
        // Move marker to user's location
        if (markerRef.current) {
          markerRef.current.setPosition(latLng);
        }
        
        setSelectedLocation({ lat: latitude, lng: longitude });
        
        // Get address for the user location
        reverseGeocode(latitude, longitude);
        
        setLocatingUser(false);
      },
      (error) => {
        console.error('Error getting user location:', error);
        toast({
          title: "Location error",
          description: error.message || "Failed to get your location",
          variant: "destructive",
        });
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Handle confirmation of selected location
  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelected(
        selectedLocation.lat.toString(),
        selectedLocation.lng.toString(),
        address
      );
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Salon Location
          </DialogTitle>
          <DialogDescription>
            Click on the map or drag the marker to set your salon's location.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* Map container */}
          <div 
            ref={mapRef}
            className="w-full h-[400px] rounded-lg bg-muted overflow-hidden"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Selected location display */}
        <div className="mt-2 text-sm text-muted-foreground">
          {address ? (
            <p><span className="font-medium">Address:</span> {address}</p>
          ) : (
            <p>Select a location on the map</p>
          )}
          {selectedLocation && (
            <p className="mt-1">
              <span className="font-medium">Coordinates:</span>{' '}
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end mt-4">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleUseMyLocation}
            disabled={locatingUser || !mapInitialized}
          >
            {locatingUser ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {locatingUser ? 'Getting Location...' : 'Use My Current Location'}
          </Button>
          
          <Button
            type="button"
            className="gap-2"
            onClick={handleConfirm}
            disabled={!selectedLocation || !mapInitialized}
          >
            <MapPin className="h-4 w-4" />
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapLocationDialog;
