import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(), // Hex code or tailwind class
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  taskName: text("task_name").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"), // Null means currently running
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const projectsRelations = relations(projects, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

// Request types
export type CreateProjectRequest = InsertProject;
export type CreateTimeEntryRequest = InsertTimeEntry;
export type UpdateTimeEntryRequest = Partial<InsertTimeEntry>;

// Response types
export type ProjectResponse = Project;
export type TimeEntryResponse = TimeEntry & { project?: Project }; // Include project relation often
