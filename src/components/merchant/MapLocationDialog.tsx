import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Use a public token as this will be exposed to the client
mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNscnRmdGZ3bjBjbjQyam85NGIzNXEwZ2cifQ.L8rfsiBP2A2xZZeYJVIrAQ';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open || !mapContainer.current) return;

    // Initialize map
    const initializeMap = async () => {
      setLoading(true);

      try {
        // Initial center coordinates
        let initialCoordinates: [number, number] = [78.9629, 20.5937]; // Default to center of India

        // If we have initial lat/lng, use those
        if (initialLat && initialLng) {
          initialCoordinates = [parseFloat(initialLng), parseFloat(initialLat)];
        }
        // Otherwise try to geocode the initial address
        else if (initialAddress) {
          try {
            const geocodeResponse = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(initialAddress)}.json?access_token=${mapboxgl.accessToken}`
            );
            
            const geocodeData = await geocodeResponse.json();
            
            if (geocodeData.features && geocodeData.features.length > 0) {
              const [lng, lat] = geocodeData.features[0].center;
              initialCoordinates = [lng, lat];
              setAddress(geocodeData.features[0].place_name || initialAddress);
            }
          } catch (error) {
            console.error('Error geocoding address:', error);
          }
        }

        // Create the map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: initialCoordinates,
          zoom: 12
        });

        // Add navigation control
        map.current.addControl(
          new mapboxgl.NavigationControl(), 
          'top-right'
        );

        // Add marker at initial position
        marker.current = new mapboxgl.Marker({ draggable: true })
          .setLngLat(initialCoordinates)
          .addTo(map.current);

        // Update selected location when marker is dragged
        marker.current.on('dragend', () => {
          if (marker.current) {
            const lngLat = marker.current.getLngLat();
            setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
            
            // Get address for the new location
            reverseGeocode(lngLat.lat, lngLat.lng);
          }
        });

        // Allow clicking on the map to move marker
        map.current.on('click', (e) => {
          if (marker.current) {
            marker.current.setLngLat(e.lngLat);
            setSelectedLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            
            // Get address for the new location
            reverseGeocode(e.lngLat.lat, e.lngLat.lng);
          }
        });

        // Set initial selected location
        setSelectedLocation({ 
          lat: initialCoordinates[1], 
          lng: initialCoordinates[0] 
        });

        // Get address for the initial location
        reverseGeocode(initialCoordinates[1], initialCoordinates[0]);

        // Map is loaded
        map.current.on('load', () => {
          setLoading(false);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setLoading(false);
        toast({
          title: "Error loading map",
          description: "Failed to load the location map. Please try again.",
          variant: "destructive",
        });
      }
    };

    initializeMap();

    // Clean up
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [open, initialAddress, initialLat, initialLng, toast]);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  // Get user's current location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setLocatingUser(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (map.current && marker.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            speed: 1.2
          });
          
          marker.current.setLngLat([longitude, latitude]);
          setSelectedLocation({ lat: latitude, lng: longitude });
          
          // Get address for the user location
          reverseGeocode(latitude, longitude);
        }
        
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
      }
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
            ref={mapContainer} 
            className="w-full h-[400px] rounded-lg bg-muted overflow-hidden"
          />
          
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
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
            disabled={locatingUser}
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
            disabled={!selectedLocation}
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
