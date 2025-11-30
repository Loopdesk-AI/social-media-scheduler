import { Request, Response } from 'express';
import { prisma } from '../database/prisma.client';

export const userController = {
    async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { geminiApiKey } = req.body;

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { geminiApiKey },
                select: { id: true, email: true, name: true, geminiApiKey: true }
            });

            return res.json(updatedUser);
        } catch (error) {
            console.error('Update profile error:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    },

    async getProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, name: true, geminiApiKey: true }
            });
            return res.json(user);
        } catch (error) {
            console.error('Get profile error:', error);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
};
