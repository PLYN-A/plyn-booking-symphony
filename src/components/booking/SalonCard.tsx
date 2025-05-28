
import React from 'react';
import { Star, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useFavorites } from '@/hooks/useFavorites';

interface SalonCardProps {
  salon: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    address: string;
    distance: string;
    image: string;
    services: Array<{
      name: string;
      price: number;
      duration: number;
    }>;
    openingTime: string;
    closingTime: string;
    featured?: boolean;
    type: 'men' | 'women' | 'unisex';
  };
  onClick: () => void;
}

const SalonCard = ({ salon, onClick }: SalonCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(salon.id);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'men':
        return 'bg-blue-100 text-blue-800';
      case 'women':
        return 'bg-pink-100 text-pink-800';
      case 'unisex':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative" onClick={onClick}>
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton
          isFavorite={isFavorite(salon.id)}
          onToggle={handleFavoriteClick}
          size="sm"
        />
      </div>
      
      <div className="relative h-48 overflow-hidden">
        <img
          src={salon.image}
          alt={salon.name}
          className="w-full h-full object-cover"
        />
        {salon.featured && (
          <Badge className="absolute top-2 left-2 bg-salon-men text-white">
            Featured
          </Badge>
        )}
        <Badge className={`absolute bottom-2 left-2 ${getTypeColor(salon.type)}`}>
          {salon.type.charAt(0).toUpperCase() + salon.type.slice(1)}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{salon.name}</h3>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{salon.rating}</span>
            <span className="text-xs text-muted-foreground">({salon.reviewCount})</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm line-clamp-1">{salon.address}</span>
          <span className="text-sm">• {salon.distance}</span>
        </div>
        
        <div className="flex items-center space-x-1 text-muted-foreground mb-3">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{salon.openingTime} - {salon.closingTime}</span>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium">Popular services:</p>
          <div className="flex flex-wrap gap-1">
            {salon.services.slice(0, 2).map((service, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {service.name} - ₹{service.price}
              </Badge>
            ))}
            {salon.services.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{salon.services.length - 2} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalonCard;
