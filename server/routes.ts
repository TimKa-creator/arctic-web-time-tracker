import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Projects ===
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    try {
      await storage.deleteProject(Number(req.params.id));
      res.status(204).end();
    } catch (err) {
       // Likely constraint violation or not found
       res.status(500).json({ message: "Could not delete project" });
    }
  });

  // === Time Entries ===
  app.get(api.timeEntries.list.path, async (req, res) => {
    const entries = await storage.getTimeEntries();
    res.json(entries);
  });

  app.post(api.timeEntries.create.path, async (req, res) => {
    try {
      // Ensure startTime is coerced to Date if string
      // Zod schema should handle this if setup correctly, but let's be safe
      const input = api.timeEntries.create.input.parse(req.body);
      const entry = await storage.createTimeEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.timeEntries.update.path, async (req, res) => {
    try {
      const input = api.timeEntries.update.input.parse(req.body);
      const entry = await storage.updateTimeEntry(Number(req.params.id), input);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.timeEntries.delete.path, async (req, res) => {
    await storage.deleteTimeEntry(Number(req.params.id));
    res.status(204).end();
  });

  // Export endpoint (Simple CSV)
  app.get(api.timeEntries.export.path, async (req, res) => {
    const entries = await storage.getTimeEntries();
    
    // Header
    let csv = "ID,Task Name,Project,Start Time,End Time,Duration (min)\n";
    
    // Rows
    csv += entries.map(e => {
      const start = new Date(e.startTime).toISOString();
      const end = e.endTime ? new Date(e.endTime).toISOString() : "Active";
      const project = e.project?.name || "No Project";
      
      let duration = 0;
      if (e.endTime) {
        duration = Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000);
      }

      return `${e.id},"${e.taskName}",${project},${start},${end},${duration}`;
    }).join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment("time-entries.csv");
    res.send(csv);
  });

  // Seed Data (if empty)
  const existingProjects = await storage.getProjects();
  if (existingProjects.length === 0) {
    console.log("Seeding database...");
    const p1 = await storage.createProject({ name: "Website Redesign", color: "#3b82f6" }); // Blue
    const p2 = await storage.createProject({ name: "Mobile App", color: "#10b981" }); // Green
    const p3 = await storage.createProject({ name: "Internal Tools", color: "#f59e0b" }); // Orange

    // Add some entries
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(yesterday.getTime() + 4 * 60 * 60 * 1000);

    await storage.createTimeEntry({
      projectId: p1.id,
      taskName: "Design System Implementation",
      startTime: twoHoursAgo,
      endTime: oneHourAgo
    });

    await storage.createTimeEntry({
      projectId: p2.id,
      taskName: "API Integration",
      startTime: yesterday,
      endTime: yesterdayEnd
    });
    
    console.log("Database seeded!");
  }

  return httpServer;
}
