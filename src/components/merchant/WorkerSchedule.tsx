import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { formatDate } from '@/lib/date-utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import WorkerDaySchedule from './schedule/WorkerDaySchedule';
import useWorkerScheduleData from '@/hooks/useWorkerScheduleData';

interface WorkerScheduleProps {
  merchantId: string;
}

const WorkerSchedule: React.FC<WorkerScheduleProps> = ({ merchantId }) => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorker, setActiveWorker] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data, error } = await supabase
          .from('workers')
          .select('id, name, specialty')
          .eq('merchant_id', merchantId)
          .eq('is_active', true);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setWorkers(data);
          setActiveWorker(data[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching workers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load workers',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkers();
  }, [merchantId, toast]);

  return (
    <Card className="bg-black/80 border-border/20">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Worker Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(date, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {workers.length > 0 && (
            <Tabs value={activeWorker || ''} onValueChange={setActiveWorker} className="w-full">
              <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 w-full">
                {workers.map((worker) => (
                  <TabsTrigger key={worker.id} value={worker.id}>
                    {worker.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {workers.map((worker) => (
                <TabsContent key={worker.id} value={worker.id} className="pt-4">
                  <WorkerDaySchedule
                    workerId={worker.id}
                    worker={worker}
                    date={date}
                    merchantId={merchantId}
                    isActive={worker.id === activeWorker}
                    loading={loading}
                    allWorkers={workers}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
          
          {workers.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No workers found. Add workers to view their schedules.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkerSchedule;
