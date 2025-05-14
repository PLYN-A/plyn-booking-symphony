import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelected: (lat: string, lng: string, address?: string) => void;
  initialAddress?: string;
  initialLat?: string;
  initialLng?: string;
}

// Component to update map view when position changes
const ChangeMapView = ({ coordinates }: { coordinates: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coordinates, 13);
  }, [coordinates, map]);
  return null;
};

// Component to handle marker drag
const DraggableMarker = ({ 
  position, 
  setPosition, 
  onDragEnd 
}: { 
  position: [number, number]; 
  setPosition: (position: [number, number]) => void;
  onDragEnd: (position: [number, number]) => void;
}) => {
  const markerRef = React.useRef(null);

  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current as unknown as L.Marker;
        if (marker != null) {
          const newPosition: [number, number] = [
            marker.getLatLng().lat,
            marker.getLatLng().lng
          ];
          setPosition(newPosition);
          onDragEnd(newPosition);
        }
      },
    }),
    [setPosition, onDragEnd],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
};

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
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]); // Default to center of India

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open) return;

    const initializeMap = async () => {
      setLoading(true);

      try {
        // If we have initial lat/lng, use those
        if (initialLat && initialLng) {
          const lat = parseFloat(initialLat);
          const lng = parseFloat(initialLng);
          setPosition([lat, lng]);
          setSelectedLocation({ lat, lng });
        }
        // Otherwise try to geocode the initial address
        else if (initialAddress) {
          try {
            // Use Nominatim for geocoding (OpenStreetMap's geocoding service)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(initialAddress)}`
            );
            
            const data = await response.json();
            
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);
              setPosition([lat, lng]);
              setSelectedLocation({ lat, lng });
              setAddress(data[0].display_name || initialAddress);
            }
          } catch (error) {
            console.error('Error geocoding address:', error);
          }
        }

        setLoading(false);
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
  }, [open, initialAddress, initialLat, initialLng, toast]);

  // Handle when a user clicks on the map
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);
    setSelectedLocation({ lat, lng });
    reverseGeocode(lat, lng);
  };
  
  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Use Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
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
        
        setPosition([latitude, longitude]);
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

  // Handle marker drag end
  const handleMarkerDragEnd = (newPosition: [number, number]) => {
    const [lat, lng] = newPosition;
    setSelectedLocation({ lat, lng });
    reverseGeocode(lat, lng);
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
          <div className="w-full h-[400px] rounded-lg bg-muted overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : (
              <MapContainer
                center={position}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                onClick={handleMapClick}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DraggableMarker 
                  position={position} 
                  setPosition={setPosition} 
                  onDragEnd={handleMarkerDragEnd}
                />
                <ChangeMapView coordinates={position} />
              </MapContainer>
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
