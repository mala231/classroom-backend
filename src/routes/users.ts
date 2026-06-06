import express from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { users } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();

// GET /api/users - List users with query filters
router.get('/', async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100);
        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(users.name, `%${search}%`),
                    ilike(users.email, `%${search}%`)
                )
            );
        }

        if (role) {
            filterConditions.push(eq(users.role, String(role)));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        // Get total count for pagination
        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(users)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0);

        // Fetch users
        const usersList = await db.select({
            ...getTableColumns(users)
        })
            .from(users)
            .where(whereClause)
            .orderBy(desc(users.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });
    } catch (e) {
        console.error(`GET /api/users error: ${e}`);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// GET /api/users/:id - Get a single user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

        if (user.length === 0) {
             res.status(404).json({ error: 'User not found' });
             return;
        }

        res.status(200).json({
            data: user[0]
        });
    } catch (e) {
        console.error(`GET /api/users/:id error: ${e}`);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
    try {
        const { id, name, email, role, image, imageCldPubId, department } = req.body;

        if (!id || !name || !email || !role) {
             res.status(400).json({ error: 'Missing required user fields' });
             return;
        }

        const [newUser] = await db.insert(users).values({
            id,
            name,
            email,
            role,
            image,
            imageCldPubId,
            department
        }).returning();

        res.status(201).json({
            data: newUser
        });
    } catch (e) {
        console.error(`POST /api/users error: ${e}`);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

export default router;
