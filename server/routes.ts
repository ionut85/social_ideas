import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { ideas } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Get all ideas
  app.get("/api/ideas", async (_req, res) => {
    try {
      const allIdeas = await db.query.ideas.findMany({
        orderBy: desc(ideas.order),
      });
      res.json(allIdeas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  // Create new idea
  app.post("/api/ideas", async (req, res) => {
    try {
      const { title, description, platform } = req.body;
      // Get max order and add 1
      const maxOrder = await db
        .select({ order: ideas.order })
        .from(ideas)
        .orderBy(desc(ideas.order))
        .limit(1);
      
      const order = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;
      
      const newIdea = await db.insert(ideas).values({
        title,
        description,
        platform,
        order,
      }).returning();

      res.json(newIdea[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  // Update idea
  app.put("/api/ideas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, platform, order } = req.body;
      
      const updatedIdea = await db.update(ideas)
        .set({ title, description, platform, order })
        .where(eq(ideas.id, parseInt(id)))
        .returning();

      res.json(updatedIdea[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to update idea" });
    }
  });

  // Delete idea
  app.delete("/api/ideas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(ideas).where(eq(ideas.id, parseInt(id)));
      res.json({ message: "Idea deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  // Update orders
  app.put("/api/ideas/reorder", async (req, res) => {
    try {
      const { updates } = req.body;
      // updates is an array of {id, order} objects
      
      for (const update of updates) {
        await db.update(ideas)
          .set({ order: update.order })
          .where(eq(ideas.id, update.id));
      }
      
      res.json({ message: "Orders updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
