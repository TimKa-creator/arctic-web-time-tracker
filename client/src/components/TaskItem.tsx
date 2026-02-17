import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Pencil, Trash2, X, Check, Calendar } from "lucide-react";
import { type TimeEntryResponse, type ProjectResponse } from "@shared/routes";
import { useUpdateTimeEntry, useDeleteTimeEntry } from "@/hooks/use-time-entries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  entry: TimeEntryResponse;
}

export function TaskItem({ entry }: TaskItemProps) {
  const updateMutation = useUpdateTimeEntry();
  const deleteMutation = useDeleteTimeEntry();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(entry.taskName);

  const duration = entry.endTime 
    ? (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000 
    : 0;
    
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);

  const handleSave = () => {
    if (editName.trim() !== entry.taskName) {
      updateMutation.mutate({ id: entry.id, taskName: editName });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      deleteMutation.mutate(entry.id);
    }
  };

  return (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card hover:bg-accent/5 rounded-xl border transition-all duration-200 hover:shadow-sm">
      <div className="flex-1 min-w-0 pr-4 w-full sm:w-auto">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full max-w-md">
            <Input 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-9"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSave} className="h-9 w-9 text-green-600">
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="h-9 w-9 text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div>
            <h4 className="font-medium text-foreground truncate">{entry.taskName}</h4>
            <div className="flex items-center gap-2 mt-1">
              {entry.project ? (
                <span 
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${entry.project.color}20`, color: entry.project.color }}
                >
                  {entry.project.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">No Project</span>
              )}
              <span className="text-xs text-muted-foreground flex items-center">
                 {format(parseISO(entry.startTime), "h:mm a")} - {entry.endTime ? format(parseISO(entry.endTime), "h:mm a") : "Running"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto mt-3 sm:mt-0 gap-6">
        <div className="font-mono font-medium text-lg text-foreground/80">
          {hours > 0 && <span>{hours}h </span>}
          <span>{minutes}m</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
