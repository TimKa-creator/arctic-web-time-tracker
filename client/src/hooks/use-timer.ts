import { useState, useEffect, useRef } from 'react';
import { differenceInSeconds } from 'date-fns';
import { useTimeEntries, useCreateTimeEntry, useUpdateTimeEntry } from './use-time-entries';
import { useToast } from './use-toast';

export function useTimer() {
  const { data: timeEntries } = useTimeEntries();
  const createMutation = useCreateTimeEntry();
  const updateMutation = useUpdateTimeEntry();
  const { toast } = useToast();

  const [elapsed, setElapsed] = useState(0);
  const activeEntry = timeEntries?.find(entry => !entry.endTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with active entry from DB
  useEffect(() => {
    if (activeEntry) {
      const startTime = new Date(activeEntry.startTime);
      const updateElapsed = () => {
        setElapsed(differenceInSeconds(new Date(), startTime));
      };
      
      updateElapsed(); // Initial update
      intervalRef.current = setInterval(updateElapsed, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeEntry]);

  const startTimer = async (taskName: string, projectId?: number) => {
    if (activeEntry) {
      toast({
        title: "Timer already running",
        description: "Please stop the current timer before starting a new one.",
        variant: "destructive",
      });
      return;
    }

    if (!taskName.trim()) {
      toast({
        title: "Task name required",
        description: "Please enter a task name to start the timer.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        taskName,
        projectId: projectId ?? null,
        startTime: new Date().toISOString(),
      });
      toast({ title: "Timer started", description: `Tracking "${taskName}"` });
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    try {
      await updateMutation.mutateAsync({
        id: activeEntry.id,
        endTime: new Date().toISOString(),
      });
      setElapsed(0);
      toast({ title: "Timer stopped", description: "Time entry saved successfully." });
    } catch (error) {
      console.error("Failed to stop timer:", error);
    }
  };

  return {
    activeEntry,
    elapsed,
    startTimer,
    stopTimer,
    isPending: createMutation.isPending || updateMutation.isPending,
  };
}
