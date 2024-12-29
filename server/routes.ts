import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { ideas, tags, ideaTags } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Get all ideas
  app.get("/api/ideas", async (_req, res) => {
    try {
      const allIdeas = await db.query.ideas.findMany({
        orderBy: desc(ideas.order),
        with: {
          ideaTags: {
            with: {
              tag: true
            }
          }
        }
      });

      // Transform the response to include tags array
      const ideasWithTags = allIdeas.map(idea => ({
        ...idea,
        tags: idea.ideaTags.map(it => it.tag)
      }));

      res.json(ideasWithTags);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      res.status(500).json({ message: "Failed to fetch ideas" });
    }
  });

  // Create new idea
  app.post("/api/ideas", async (req, res) => {
    try {
      const { title, description, platform, tags: tagNames = [] } = req.body;
      console.log("Creating new idea with tags:", { title, tagNames });

      // Get max order and add 1
      const maxOrder = await db
        .select({ order: ideas.order })
        .from(ideas)
        .orderBy(desc(ideas.order))
        .limit(1);

      const order = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;

      // Create the idea
      const [newIdea] = await db.insert(ideas).values({
        title,
        description,
        platform,
        order,
      }).returning();

      console.log("Created idea:", newIdea);

      // Create or get existing tags and link them to the idea
      for (const tagName of tagNames) {
        console.log("Processing tag:", tagName);

        // Try to find existing tag or create new one
        let [existingTag] = await db.select().from(tags).where(eq(tags.name, tagName.toLowerCase()));
        let tag = existingTag;

        if (!existingTag) {
          console.log("Creating new tag:", tagName);
          const [newTag] = await db.insert(tags)
            .values({ name: tagName.toLowerCase() })
            .returning();
          tag = newTag;
        }

        console.log("Linking tag to idea:", { tagId: tag.id, ideaId: newIdea.id });
        // Link tag to idea
        await db.insert(ideaTags).values({
          ideaId: newIdea.id,
          tagId: tag.id
        });
      }

      // Fetch the created idea with its tags
      const ideaWithTags = await db.query.ideas.findFirst({
        where: eq(ideas.id, newIdea.id),
        with: {
          ideaTags: {
            with: {
              tag: true
            }
          }
        }
      });

      const response = {
        ...ideaWithTags,
        tags: ideaWithTags?.ideaTags.map(it => it.tag) || []
      };

      console.log("Returning new idea with tags:", response);
      res.json(response);
    } catch (error) {
      console.error("Error creating idea:", error);
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  // Get all tags
  app.get("/api/tags", async (_req, res) => {
    try {
      const allTags = await db.query.tags.findMany();
      res.json(allTags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Update idea tags
  app.put("/api/ideas/:id/tags", async (req, res) => {
    try {
      const { id } = req.params;
      const { tags: tagNames } = req.body;
      console.log("Updating tags for idea:", { id, tagNames });

      // Remove existing tags
      await db.delete(ideaTags)
        .where(eq(ideaTags.ideaId, parseInt(id)));

      console.log("Removed existing tags");

      // Add new tags
      for (const tagName of tagNames) {
        console.log("Processing tag:", tagName);

        // Try to find existing tag or create new one
        let [existingTag] = await db.select().from(tags).where(eq(tags.name, tagName.toLowerCase()));
        let tag = existingTag;

        if (!existingTag) {
          console.log("Creating new tag:", tagName);
          const [newTag] = await db.insert(tags)
            .values({ name: tagName.toLowerCase() })
            .returning();
          tag = newTag;
        }

        console.log("Linking tag to idea:", { tagId: tag.id, ideaId: id });
        // Link tag to idea
        await db.insert(ideaTags).values({
          ideaId: parseInt(id),
          tagId: tag.id
        });
      }

      // Fetch updated idea with tags
      const updatedIdea = await db.query.ideas.findFirst({
        where: eq(ideas.id, parseInt(id)),
        with: {
          ideaTags: {
            with: {
              tag: true
            }
          }
        }
      });

      const response = {
        ...updatedIdea,
        tags: updatedIdea?.ideaTags.map(it => it.tag) || []
      };

      console.log("Returning updated idea with tags:", response);
      res.json(response);
    } catch (error) {
      console.error("Error updating idea tags:", error);
      res.status(500).json({ message: "Failed to update idea tags" });
    }
  });

  // Update idea
  app.put("/api/ideas/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, platform } = req.body;
      console.log("Updating idea:", { id, title, description, platform });

      const [updatedIdea] = await db.update(ideas)
        .set({ title, description, platform })
        .where(eq(ideas.id, parseInt(id)))
        .returning();

      // Fetch the updated idea with its tags
      const ideaWithTags = await db.query.ideas.findFirst({
        where: eq(ideas.id, updatedIdea.id),
        with: {
          ideaTags: {
            with: {
              tag: true
            }
          }
        }
      });

      const response = {
        ...ideaWithTags,
        tags: ideaWithTags?.ideaTags.map(it => it.tag) || []
      };

      console.log("Returning updated idea:", response);
      res.json(response);
    } catch (error) {
      console.error("Error updating idea:", error);
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
      console.error("Error deleting idea:", error);
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  // Update orders
  app.put("/api/ideas/reorder", async (req, res) => {
    try {
      const { updates } = req.body;

      for (const update of updates) {
        await db.update(ideas)
          .set({ order: update.order })
          .where(eq(ideas.id, update.id));
      }

      res.json({ message: "Orders updated successfully" });
    } catch (error) {
      console.error("Error updating orders:", error);
      res.status(500).json({ message: "Failed to update orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}