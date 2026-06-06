import express from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { departments, subjects } from "../db/schema/index.js";
import { db } from "../db/index.js";
const router = express.Router();
router.get('/', async (req, res) => {
    try {
        const { search, department, page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100); // Max 100 records per page
        const offset = (currentPage - 1) * limitPerPage;
        const filterConditions = [];
        if (search) {
            filterConditions.push(

                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`),
                )
            )
        }




        if (department) {
            const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`;
            filterConditions.push(ilike(departments.name, deptPattern));
        }
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const subjectliist = await db.select({
            ...getTableColumns(subjects),
            department: {
                ...getTableColumns(departments)
            }
        })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json(
            {
                data: subjectliist,
                pagination:
                {
                    page: currentPage,
                    limit: limitPerPage,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limitPerPage),
                }

            }
        )
    }
    catch (e) {
        console.error(`GET / subjects error: ${e}`);
        res.status(500).json({ error: 'Failed to get subjects' });
    }

})

// POST / - Create a new subject
router.post('/', async (req, res) => {
    try {
        const { name, code, description, department } = req.body;

        if (!name || !code || !department) {
             res.status(400).json({ error: 'Missing required subject fields' });
             return;
        }

        // Resolve department by name or code
        let dept = await db.select().from(departments).where(eq(departments.name, department)).limit(1);
        if (dept.length === 0) {
            dept = await db.select().from(departments).where(eq(departments.code, department)).limit(1);
        }

        const departmentObj = dept[0];
        if (!departmentObj) {
             res.status(400).json({ error: `Department '${department}' not found` });
             return;
        }

        const insertedSubjects = await db.insert(subjects).values({
            name,
            code,
            description,
            departmentId: departmentObj.id
        }).returning();

        const newSubject = insertedSubjects[0];
        if (!newSubject) {
             res.status(500).json({ error: 'Failed to create subject' });
             return;
        }

        res.status(201).json({
            data: newSubject
        });
    } catch (e) {
        console.error(`POST /api/subjects error: ${e}`);
        res.status(500).json({ error: 'Failed to create subject' });
    }
});

export default router;