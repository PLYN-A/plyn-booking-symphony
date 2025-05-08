
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export interface SubmitButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  text?: string;
  loadingText?: string;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  isLoading,
  disabled = false,
  text = "Submit Application",
  loadingText = "Submitting..."
}) => {
  return (
    <Button 
      type="submit" 
      className="w-full" 
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
};

export default SubmitButton;
