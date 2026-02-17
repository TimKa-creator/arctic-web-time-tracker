import { useMemo, useState } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useProjects } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Download, PieChart as PieIcon, TrendingUp } from "lucide-react";

type Period = "week" | "month";

export default function Reports() {
  const { data: entries } = useTimeEntries();
  const { data: projects } = useProjects();
  const [period, setPeriod] = useState<Period>("week");

  // Filter entries based on period
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    
    const now = new Date();
    let start, end;
    
    if (period === "week") {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(now);
      end = endOfMonth(now);
    }

    return entries.filter(entry => {
      if (!entry.endTime) return false; // Exclude active
      const entryDate = parseISO(entry.startTime);
      return isWithinInterval(entryDate, { start, end });
    });
  }, [entries, period]);

  // Project Distribution Data
  const projectData = useMemo(() => {
    const data: Record<string, { name: string; value: number; color: string }> = {};
    
    filteredEntries.forEach(entry => {
      const duration = (new Date(entry.endTime!).getTime() - new Date(entry.startTime).getTime()) / 1000 / 3600; // Hours
      const projectId = entry.projectId || "uncategorized";
      
      if (!data[projectId]) {
        const project = projects?.find(p => p.id === entry.projectId);
        data[projectId] = {
          name: project ? project.name : "Uncategorized",
          value: 0,
          color: project ? project.color : "#94a3b8"
        };
      }
      
      data[projectId].value += duration;
    });

    return Object.values(data).filter(d => d.value > 0).map(d => ({ ...d, value: Number(d.value.toFixed(2)) }));
  }, [filteredEntries, projects]);

  // Daily Activity Data
  const dailyData = useMemo(() => {
    const data: Record<string, number> = {};
    
    // Initialize empty days
    if (period === "week") {
       const start = startOfWeek(new Date(), { weekStartsOn: 1 });
       for(let i=0; i<7; i++) {
         const d = new Date(start);
         d.setDate(d.getDate() + i);
         data[format(d, "EEE")] = 0;
       }
    }
    
    filteredEntries.forEach(entry => {
      const date = parseISO(entry.startTime);
      const key = period === "week" ? format(date, "EEE") : format(date, "d");
      const duration = (new Date(entry.endTime!).getTime() - new Date(entry.startTime).getTime()) / 1000 / 3600;
      
      if (data[key] !== undefined) {
        data[key] += duration;
      } else if (period === "month") {
        data[key] = (data[key] || 0) + duration;
      }
    });

    return Object.entries(data).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [filteredEntries, period]);

  const totalHours = projectData.reduce((acc, curr) => acc + curr.value, 0).toFixed(1);

  const handleExport = () => {
    window.open("/api/time-entries/export", "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">Analyze your time usage patterns.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-md border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Total Hours
            </CardTitle>
            <CardDescription>Tracked this {period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-display text-primary">{totalHours}</div>
            <p className="text-sm text-muted-foreground mt-2">Hours logged across {projectData.length} projects</p>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="w-5 h-5" /> Project Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             {projectData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={projectData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {projectData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-muted-foreground">
                 No data available for this period
               </div>
             )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Project Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectData.length > 0 ? (
                projectData.map((project, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {project.value.toFixed(2)}h
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No projects tracked yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
