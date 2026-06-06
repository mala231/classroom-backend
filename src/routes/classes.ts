import express from "express";
import { and, desc, eq, getTableColumns, ilike, inArray, or, sql } from "drizzle-orm";
import { classes, subjects, users, schedules } from "../db/schema/index.js";
import { db } from "../db/index.js";

const router = express.Router();

// GET /api/classes - List classes
router.get('/', async (req, res) => {
    try {
        const { search, subject, teacher, page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100);
        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(ilike(classes.name, `%${search}%`));
        }

        if (subject) {
            filterConditions.push(eq(classes.subjectId, Number(subject)));
        }

        if (teacher) {
            filterConditions.push(eq(classes.teacherId, String(teacher)));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        // Count query
        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(classes)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0);

        // Select classes with subject and teacher
        const rawClasses = await db.select({
            class: getTableColumns(classes),
            subject: getTableColumns(subjects),
            teacher: getTableColumns(users),
        })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(users, eq(classes.teacherId, users.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        // Format to expected nested structure
        const formattedClasses = rawClasses.map(row => ({
            ...row.class,
            subject: row.subject || undefined,
            teacher: row.teacher || undefined,
            schedules: [] as any[]
        }));

        // Fetch schedules for these classes
        if (formattedClasses.length > 0) {
            const classIds = formattedClasses.map(c => c.id);
            const rawSchedules = await db.select()
                .from(schedules)
                .where(inArray(schedules.classId, classIds));

            formattedClasses.forEach(c => {
                c.schedules = rawSchedules.filter(s => s.classId === c.id);
            });
        }

        res.status(200).json({
            data: formattedClasses,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        });
    } catch (e) {
        console.error(`GET /api/classes error: ${e}`);
        res.status(500).json({ error: 'Failed to get classes' });
    }
});

// GET /api/classes/:id - Get single class by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const classId = Number(id);

        if (isNaN(classId)) {
             res.status(400).json({ error: 'Invalid class ID' });
             return;
        }

        const rawClass = await db.select({
            class: getTableColumns(classes),
            subject: getTableColumns(subjects),
            teacher: getTableColumns(users),
        })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(users, eq(classes.teacherId, users.id))
            .where(eq(classes.id, classId))
            .limit(1);

        const firstClass = rawClass[0];
        if (!firstClass) {
             res.status(404).json({ error: 'Class not found' });
             return;
        }

        const classSchedules = await db.select()
            .from(schedules)
            .where(eq(schedules.classId, classId));

        const formattedClass = {
            ...firstClass.class,
            subject: firstClass.subject || undefined,
            teacher: firstClass.teacher || undefined,
            schedules: classSchedules
        };

        res.status(200).json({
            data: formattedClass
        });
    } catch (e) {
        console.error(`GET /api/classes/:id error: ${e}`);
        res.status(500).json({ error: 'Failed to get class' });
    }
});

// POST /api/classes - Create new class
router.post('/', async (req, res) => {
    try {
        const { name, description, capacity, status, bannerUrl, bannerCldPubId, subjectId, teacherId, schedules: inputSchedules } = req.body;

        if (!name || !capacity || !subjectId || !teacherId || !bannerUrl || !bannerCldPubId) {
             res.status(400).json({ error: 'Missing required class fields' });
             return;
        }

        // Generate a 6-letter uppercase invite code
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Insert class record
        const insertedClasses = await db.insert(classes).values({
            name,
            description,
            capacity: Number(capacity),
            status: status || 'active',
            inviteCode,
            bannerUrl,
            bannerCldPubId,
            subjectId: Number(subjectId),
            teacherId: String(teacherId)
        }).returning();

        const newClass = insertedClasses[0];
        if (!newClass) {
             res.status(500).json({ error: 'Failed to create class record' });
             return;
        }

        // Insert schedules if provided
        let createdSchedules: any[] = [];
        if (Array.isArray(inputSchedules) && inputSchedules.length > 0) {
            const schedulesData = inputSchedules.map(sched => ({
                classId: newClass.id,
                day: sched.day,
                startTime: sched.startTime,
                endTime: sched.endTime
            }));

            createdSchedules = await db.insert(schedules).values(schedulesData).returning();
        }

        res.status(201).json({
            data: {
                ...newClass,
                schedules: createdSchedules
            }
        });
    } catch (e) {
        console.error(`POST /api/classes error: ${e}`);
        res.status(500).json({ error: 'Failed to create class' });
    }
});

export default router;
