
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { getMerchantSettings, upsertMerchantSettings } from '@/utils/workerUtils';

interface MerchantSettingsManagerProps {
  merchantId: string;
  onSettingsUpdated?: () => void;
}

const MerchantSettingsManager: React.FC<MerchantSettingsManagerProps> = ({ merchantId, onSettingsUpdated }) => {
  const [settings, setSettings] = useState({
    total_workers: 1,
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    break_start: '',
    break_end: '',
    worker_assignment_strategy: 'next-available'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [merchantId]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getMerchantSettings(merchantId);
      if (data) {
        setSettings({
          total_workers: data.total_workers || 1,
          working_hours_start: data.working_hours_start || '09:00',
          working_hours_end: data.working_hours_end || '17:00',
          break_start: data.break_start || '',
          break_end: data.break_end || '',
          worker_assignment_strategy: data.worker_assignment_strategy || 'next-available'
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message || "Failed to load merchant settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await upsertMerchantSettings(merchantId, {
        ...settings,
        break_start: settings.break_start || null,
        break_end: settings.break_end || null
      });
      
      toast({
        title: "Settings Saved",
        description: "Your merchant settings have been updated successfully",
      });
      
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save merchant settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <Card className="bg-black/80 border-border/20">
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/80 border-border/20">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings2 className="h-5 w-5 mr-2" />
          Business Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalWorkers">Number of Workers</Label>
            <Select 
              value={settings.total_workers.toString()}
              onValueChange={(value) => handleChange('total_workers', parseInt(value))}
            >
              <SelectTrigger id="totalWorkers">
                <SelectValue placeholder="Select number of workers" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assignmentStrategy">Worker Assignment Strategy</Label>
            <Select 
              value={settings.worker_assignment_strategy}
              onValueChange={(value) => handleChange('worker_assignment_strategy', value)}
            >
              <SelectTrigger id="assignmentStrategy">
                <SelectValue placeholder="Select assignment strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="next-available">Next Available</SelectItem>
                <SelectItem value="round-robin">Round Robin</SelectItem>
                <SelectItem value="specialty">By Specialty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workingHoursStart">Working Hours Start</Label>
            <Input
              id="workingHoursStart"
              type="time"
              value={settings.working_hours_start}
              onChange={(e) => handleChange('working_hours_start', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="workingHoursEnd">Working Hours End</Label>
            <Input
              id="workingHoursEnd"
              type="time"
              value={settings.working_hours_end}
              onChange={(e) => handleChange('working_hours_end', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="breakStart">Break Start (Optional)</Label>
            <Input
              id="breakStart"
              type="time"
              value={settings.break_start}
              onChange={(e) => handleChange('break_start', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="breakEnd">Break End (Optional)</Label>
            <Input
              id="breakEnd"
              type="time"
              value={settings.break_end}
              onChange={(e) => handleChange('break_end', e.target.value)}
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MerchantSettingsManager;
