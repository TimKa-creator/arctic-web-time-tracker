import { useMemo } from "react";
import { format, parseISO, isToday, isSameDay } from "date-fns";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { GlobalTracker } from "@/components/GlobalTracker";
import { TaskItem } from "@/components/TaskItem";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarOff } from "lucide-react";

export default function Tracker() {
  const { data: entries, isLoading } = useTimeEntries();

  // Group entries by day
  const groupedEntries = useMemo(() => {
    if (!entries) return {};
    
    // Sort by start time descending
    const sorted = [...entries].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    const groups: Record<string, typeof entries> = {};
    
    sorted.forEach(entry => {
      // Only show completed entries in the list (active one is in GlobalTracker)
      if (!entry.endTime) return;
      
      const dateKey = format(parseISO(entry.startTime), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });

    return groups;
  }, [entries]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const days = Object.keys(groupedEntries).sort().reverse();

  return (
    <div className="space-y-8">
      <GlobalTracker />
      
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {days.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No entries yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Start the timer above to track your first task today.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {days.map(dateKey => {
              const date = parseISO(dateKey);
              const dayTotalSeconds = groupedEntries[dateKey].reduce((acc, entry) => {
                const duration = entry.endTime 
                  ? (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000 
                  : 0;
                return acc + duration;
              }, 0);

              const hours = Math.floor(dayTotalSeconds / 3600);
              const minutes = Math.floor((dayTotalSeconds % 3600) / 60);

              return (
                <div key={dateKey} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-end justify-between px-2 pb-2 border-b">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {isToday(date) ? "Today" : format(date, "EEEE, MMM d")}
                      </h3>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      Total: {hours}h {minutes}m
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {groupedEntries[dateKey].map(entry => (
                      <TaskItem key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
