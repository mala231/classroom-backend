import express from "express";
import { departments } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();

// GET /api/departments - List all departments
router.get('/', async (req, res) => {
    try {
        const list = await db.select().from(departments);
        res.status(200).json({
            data: list
        });
    } catch (e) {
        console.error(`GET /api/departments error: ${e}`);
        res.status(500).json({ error: 'Failed to get departments' });
    }
});

export default router;
