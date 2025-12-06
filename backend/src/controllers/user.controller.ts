import { Request, Response } from "express";
import { db } from "../database/db";
import { users } from "../database/schema";
import { eq } from "drizzle-orm";

// Default user ID for simplified operation (no auth)
const DEFAULT_USER_ID = "default-user";

export const userController = {
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = DEFAULT_USER_ID;
      const { name, email } = req.body;

      // Check if user exists, if not create one
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      let updatedUser;
      if (!existingUser) {
        // Create default user if it doesn't exist
        const [created] = await db
          .insert(users)
          .values({
            id: userId,
            email: email || "default@example.com",
            name: name || "Default User",
          })
          .returning({
            id: users.id,
            email: users.email,
            name: users.name,
          });
        updatedUser = created;
      } else {
        const updateData: { name?: string; email?: string; updatedAt: Date } = {
          updatedAt: new Date(),
        };
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;

        const [updated] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            email: users.email,
            name: users.name,
          });
        updatedUser = updated;
      }

      return res.json(updatedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  },

  async getProfile(req: Request, res: Response) {
    try {
      const userId = DEFAULT_USER_ID;

      let user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          email: true,
          name: true,
        },
      });

      // Create default user if it doesn't exist
      if (!user) {
        const [created] = await db
          .insert(users)
          .values({
            id: userId,
            email: "default@example.com",
            name: "Default User",
          })
          .returning({
            id: users.id,
            email: users.email,
            name: users.name,
          });
        user = created;
      }

      return res.json(user);
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  },
};
