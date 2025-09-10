import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  type User, 
  type Lead, 
  type Estimation, 
  type Contact,
  type InsertUser, 
  type InsertLead, 
  type InsertEstimation, 
  type InsertContact,
  users,
  leads,
  estimations,
  contacts
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(limit?: number): Promise<Lead[]>;
  updateLeadStatus(id: string, status: string): Promise<void>;
  
  // Estimations
  createEstimation(estimation: InsertEstimation): Promise<Estimation>;
  getEstimationsByLeadId(leadId: string): Promise<Estimation[]>;
  
  // Contacts
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(limit?: number): Promise<Contact[]>;
}

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Leads
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const result = await db.insert(leads).values(insertLead).returning();
    return result[0];
  }

  async getLeads(limit = 50): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
  }

  async updateLeadStatus(id: string, status: string): Promise<void> {
    await db.update(leads).set({ status }).where(eq(leads.id, id));
  }

  // Estimations
  async createEstimation(insertEstimation: InsertEstimation): Promise<Estimation> {
    const result = await db.insert(estimations).values(insertEstimation).returning();
    return result[0];
  }

  async getEstimationsByLeadId(leadId: string): Promise<Estimation[]> {
    return await db.select().from(estimations).where(eq(estimations.leadId, leadId));
  }

  // Contacts
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(insertContact).returning();
    return result[0];
  }

  async getContacts(limit = 50): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(limit);
  }
}

export const storage = new SupabaseStorage();