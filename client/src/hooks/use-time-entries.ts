import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type TimeEntryInput, type TimeEntryUpdateInput } from "@shared/routes";
import { z } from "zod";

export function useTimeEntries() {
  return useQuery({
    queryKey: [api.timeEntries.list.path],
    queryFn: async () => {
      const res = await fetch(api.timeEntries.list.path);
      if (!res.ok) throw new Error("Failed to fetch time entries");
      return api.timeEntries.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TimeEntryInput) => {
      const res = await fetch(api.timeEntries.create.path, {
        method: api.timeEntries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create time entry");
      return api.timeEntries.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.timeEntries.list.path] }),
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & TimeEntryUpdateInput) => {
      const url = buildUrl(api.timeEntries.update.path, { id });
      const res = await fetch(url, {
        method: api.timeEntries.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update time entry");
      return api.timeEntries.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.timeEntries.list.path] }),
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.timeEntries.delete.path, { id });
      const res = await fetch(url, { method: api.timeEntries.delete.method });
      if (!res.ok) throw new Error("Failed to delete time entry");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.timeEntries.list.path] }),
  });
}
