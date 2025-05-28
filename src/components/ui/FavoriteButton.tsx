
import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FavoriteButton = ({ 
  isFavorite, 
  onToggle, 
  size = 'md',
  className 
}: FavoriteButtonProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        sizeClasses[size],
        'rounded-full hover:bg-background/80 transition-colors',
        className
      )}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-colors',
          isFavorite 
            ? 'fill-red-500 text-red-500' 
            : 'text-muted-foreground hover:text-red-500'
        )}
      />
    </Button>
  );
};

export default FavoriteButton;
