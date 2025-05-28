
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useFavorites } from '@/hooks/useFavorites';

interface SalonCardProps {
  salon: {
    id: string;
    business_name: string;
    business_address: string;
    business_phone: number;
    service_category: string;
  };
  onSelect: (salon: any) => void;
}

const SalonCard = ({ salon, onSelect }: SalonCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(salon.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative">
        <div className="absolute top-4 right-4 z-10">
          <FavoriteButton
            isFavorite={isFavorite(salon.id)}
            onToggle={handleFavoriteClick}
            size="sm"
            className="bg-white/80 hover:bg-white/90"
          />
        </div>
        
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{salon.business_name}</CardTitle>
          <CardDescription className="flex items-center text-sm">
            <MapPin className="h-3 w-3 mr-1" />
            {salon.business_address}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{salon.service_category}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Phone:</span>
              <span>{salon.business_phone}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 mr-1 text-yellow-500" />
              <span>4.8 (120 reviews)</span>
            </div>
            
            <div className="flex items-center text-sm text-green-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>Open now</span>
            </div>
          </div>
          
          <Button 
            className="w-full mt-4" 
            onClick={() => onSelect(salon)}
          >
            View Details & Book
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SalonCard;
