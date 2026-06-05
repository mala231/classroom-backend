import 'dotenv/config';
import { db, pool } from './index.js';
import { departments, subjects } from './schema/index.js';

async function seed() {
  try {
    console.log('Seeding database...');

    // 1. Check if departments already exist
    const existingDepts = await db.select().from(departments).limit(1);
    if (existingDepts.length > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    // 2. Insert Departments
    console.log('Inserting departments...');
    const [csDept, mathDept] = await db.insert(departments).values([
      {
        code: 'CS',
        name: 'Computer Science',
        description: 'Department of Computer Science and Engineering',
      },
      {
        code: 'MATH',
        name: 'Mathematics',
        description: 'Department of Mathematics and Statistics',
      }
    ]).returning();

    if (!csDept || !mathDept) {
      throw new Error('Failed to insert departments.');
    }

    // 3. Insert Subjects
    console.log('Inserting subjects...');
    await db.insert(subjects).values([
      {
        departmentId: csDept.id,
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Fundamentals of programming and problem solving.',
      },
      {
        departmentId: csDept.id,
        code: 'CS201',
        name: 'Data Structures and Algorithms',
        description: 'Core concepts of data organization and algorithm analysis.',
      },
      {
        departmentId: mathDept.id,
        code: 'MATH101',
        name: 'Calculus I',
        description: 'Differential and integral calculus of a single variable.',
      },
      {
        departmentId: mathDept.id,
        code: 'MATH201',
        name: 'Linear Algebra',
        description: 'Vector spaces, matrices, linear transformations, and eigenvalues.',
      }
    ]);

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
