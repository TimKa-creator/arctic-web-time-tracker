import { db } from "./db";
import {
  projects,
  timeEntries,
  type Project,
  type InsertProject,
  type TimeEntry,
  type InsertTimeEntry,
  type UpdateTimeEntryRequest,
  type ProjectResponse,
  type TimeEntryResponse
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Projects
  getProjects(): Promise<ProjectResponse[]>;
  getProject(id: number): Promise<ProjectResponse | undefined>;
  createProject(project: InsertProject): Promise<ProjectResponse>;
  deleteProject(id: number): Promise<void>;

  // Time Entries
  getTimeEntries(): Promise<TimeEntryResponse[]>;
  getTimeEntry(id: number): Promise<TimeEntryResponse | undefined>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntryResponse>;
  updateTimeEntry(id: number, updates: UpdateTimeEntryRequest): Promise<TimeEntryResponse>;
  deleteTimeEntry(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(): Promise<ProjectResponse[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<ProjectResponse | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<ProjectResponse> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async deleteProject(id: number): Promise<void> {
    // Note: This might fail if there are dependent time entries. 
    // Ideally we'd cascade delete or prevent deletion in UI.
    // For now, let's assume UI handles confirmation or we let DB error.
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntryResponse[]> {
    // Perform a join to include project details
    const rows = await db
      .select({
        timeEntry: timeEntries,
        project: projects,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.projectId, projects.id))
      .orderBy(desc(timeEntries.startTime));

    return rows.map((row) => ({
      ...row.timeEntry,
      project: row.project || undefined,
    }));
  }

  async getTimeEntry(id: number): Promise<TimeEntryResponse | undefined> {
    const rows = await db
      .select({
        timeEntry: timeEntries,
        project: projects,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(eq(timeEntries.id, id));

    if (rows.length === 0) return undefined;

    const row = rows[0];
    return {
      ...row.timeEntry,
      project: row.project || undefined,
    };
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntryResponse> {
    const [newEntry] = await db.insert(timeEntries).values(entry).returning();
    
    // Fetch again to get project relation if needed, or just return basic entry
    // For simplicity, let's return basic entry and let client re-fetch or update cache
    return newEntry;
  }

  async updateTimeEntry(id: number, updates: UpdateTimeEntryRequest): Promise<TimeEntryResponse> {
    const [updated] = await db
      .update(timeEntries)
      .set(updates)
      .where(eq(timeEntries.id, id))
      .returning();
    return updated;
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }
}

export const storage = new DatabaseStorage();
