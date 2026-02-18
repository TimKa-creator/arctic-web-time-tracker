import { useState, useEffect, useMemo } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useTimer } from "@/hooks/use-timer";
import { useProjects } from "@/hooks/use-projects";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function GlobalTracker() {
  const { activeEntry, elapsed, startTimer, stopTimer, isPending } = useTimer();
  const { data: projects } = useProjects();
  const { data: entries } = useTimeEntries();
  
  const [taskName, setTaskName] = useState("");
  const [projectId, setProjectId] = useState<string>("");

  // Get unique task names for autocomplete
  const taskSuggestions = useMemo(() => {
    if (!entries) return [];
    const names = entries.map(e => e.taskName);
    return Array.from(new Set(names)).sort();
  }, [entries]);

  // Timer Persistence: Sync inputs when active entry exists (e.g. on refresh)
  // Ensure we only set if empty to avoid overwriting user typing before start
  useEffect(() => {
    if (activeEntry) {
      if (!taskName) setTaskName(activeEntry.taskName);
      if (!projectId && activeEntry.projectId) {
        setProjectId(activeEntry.projectId.toString());
      }
    }
  }, [activeEntry]);

  const handleToggle = () => {
    if (activeEntry) {
      stopTimer();
      // Clear inputs after stopping
      setTaskName("");
      setProjectId("");
    } else {
      startTimer(taskName, projectId ? parseInt(projectId) : undefined);
    }
  };

  return (
    <div className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-md border-b shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          <div className="flex-1 w-full relative group">
            <Input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="What are you working on?"
              disabled={!!activeEntry}
              list="task-suggestions"
              className="w-full h-12 pl-4 pr-12 rounded-xl border-2 focus-visible:ring-0 focus-visible:border-primary/50 text-base shadow-sm transition-all"
            />
            <datalist id="task-suggestions">
              {taskSuggestions.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {activeEntry && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select 
              value={projectId} 
              onValueChange={setProjectId}
              disabled={!!activeEntry}
            >
              <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl border-2 shadow-sm">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: project.color }} 
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="hidden md:flex items-center justify-center min-w-[100px] font-mono text-xl font-bold text-foreground/80">
              {formatDuration(elapsed)}
            </div>

            <Button
              onClick={handleToggle}
              disabled={isPending || (!activeEntry && !taskName.trim())}
              size="lg"
              className={cn(
                "h-12 w-full md:w-auto px-8 rounded-xl font-semibold shadow-lg transition-all hover:scale-105 active:scale-95",
                activeEntry 
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-destructive/25" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25"
              )}
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : activeEntry ? (
                <div className="flex items-center gap-2">
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start</span>
                </div>
              )}
            </Button>
          </div>
          
          {/* Mobile Timer Display */}
          <div className="md:hidden w-full flex justify-center py-2 font-mono text-2xl font-bold">
            {formatDuration(elapsed)}
          </div>

        </div>
      </div>
    </div>
  );
}
