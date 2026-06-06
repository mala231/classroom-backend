import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, pool } from './index.js';
import { departments, subjects, users, classes, schedules } from './schema/index.js';

async function seed() {
  try {
    console.log('Seeding database...');

    // 1. Seed Departments
    console.log('Upserting departments...');
    const deptsToInsert = [
      { code: 'CS', name: 'Computer Science', description: 'Department of Computer Science and Engineering' },
      { code: 'MATH', name: 'Mathematics', description: 'Department of Mathematics and Statistics' }
    ];
    
    const insertedDepts: any[] = [];
    for (const dept of deptsToInsert) {
      const existing = await db.select().from(departments).where(eq(departments.code, dept.code)).limit(1);
      if (existing.length > 0 && existing[0]) {
        insertedDepts.push(existing[0]);
      } else {
        const [newDept] = await db.insert(departments).values(dept).returning();
        if (newDept) {
          insertedDepts.push(newDept);
        }
      }
    }
    const csDept = insertedDepts.find(d => d && d.code === 'CS');
    const mathDept = insertedDepts.find(d => d && d.code === 'MATH');

    if (!csDept || !mathDept) {
      throw new Error('Failed to obtain departments.');
    }

    // 2. Seed Subjects
    console.log('Upserting subjects...');
    const subjectsToInsert = [
      { departmentId: csDept.id, code: 'CS101', name: 'Introduction to Programming', description: 'Fundamentals of programming and problem solving.' },
      { departmentId: csDept.id, code: 'CS201', name: 'Data Structures and Algorithms', description: 'Core concepts of data organization and algorithm analysis.' },
      { departmentId: mathDept.id, code: 'MATH101', name: 'Calculus I', description: 'Differential and integral calculus of a single variable.' },
      { departmentId: mathDept.id, code: 'MATH201', name: 'Linear Algebra', description: 'Vector spaces, matrices, linear transformations, and eigenvalues.' }
    ];

    const insertedSubjects: any[] = [];
    for (const sub of subjectsToInsert) {
      const existing = await db.select().from(subjects).where(eq(subjects.code, sub.code)).limit(1);
      if (existing.length > 0 && existing[0]) {
        insertedSubjects.push(existing[0]);
      } else {
        const [newSub] = await db.insert(subjects).values(sub).returning();
        if (newSub) {
          insertedSubjects.push(newSub);
        }
      }
    }
    
    // 3. Seed Users (Teachers)
    console.log('Upserting teachers...');
    const teachersToInsert = [
      { id: '1', name: 'Dr. Alan Turing', email: 'alan@school.com', role: 'teacher', department: 'Computer Science' },
      { id: '2', name: 'Jane Smith', email: 'jane@school.com', role: 'teacher', department: 'Mathematics' },
      { id: '3', name: 'John Doe', email: 'john@school.com', role: 'teacher', department: 'Computer Science' },
      { id: '4', name: 'Jane Doe', email: 'jane.doe@school.com', role: 'teacher', department: 'Mathematics' }
    ];

    for (const teacher of teachersToInsert) {
      const existing = await db.select().from(users).where(eq(users.id, teacher.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(users).values(teacher);
      }
    }

    // 4. Seed Classes
    console.log('Upserting classes...');
    const cs101Sub = insertedSubjects.find(s => s && s.code === 'CS101');
    const math201Sub = insertedSubjects.find(s => s && s.code === 'MATH201');

    if (cs101Sub && math201Sub) {
      const classesToInsert = [
        {
          name: 'Introduction to Computer Science - Section A',
          description: 'Introductory class for computer science freshmen.',
          capacity: 30,
          status: 'active',
          inviteCode: 'CS101A',
          bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
          bannerCldPubId: 'banner1',
          subjectId: cs101Sub.id,
          teacherId: '1'
        },
        {
          name: 'Linear Algebra - Section B',
          description: 'Core linear algebra concepts for mathematics majors.',
          capacity: 25,
          status: 'active',
          inviteCode: 'LA201B',
          bannerUrl: 'https://images.unsplash.com/photo-1453733190148-c44698c265f8',
          bannerCldPubId: 'banner2',
          subjectId: math201Sub.id,
          teacherId: '2'
        }
      ];

      for (const cls of classesToInsert) {
        const existing = await db.select().from(classes).where(eq(classes.inviteCode, cls.inviteCode)).limit(1);
        if (existing.length === 0) {
          const [newCls] = await db.insert(classes).values(cls).returning();
          
          if (newCls) {
            // Seed Schedules for this class
            if (cls.inviteCode === 'CS101A') {
              await db.insert(schedules).values({
                classId: newCls.id,
                day: 'Monday',
                startTime: '09:00',
                endTime: '10:30'
              });
            } else if (cls.inviteCode === 'LA201B') {
              await db.insert(schedules).values({
                classId: newCls.id,
                day: 'Wednesday',
                startTime: '11:00',
                endTime: '12:30'
              });
            }
          }
        }
      }
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('Database connection closed.');
    }
  }
}

seed();
