import { eq } from 'drizzle-orm';
import { index, pool } from './db/index.js';
import { departments } from './db/schema/index.js';

async function main() {
  try {
    console.log('Performing CRUD operations on departments...');

    // CREATE: Insert a new department
    const [newDept] = await index
      .insert(departments)
      .values({
        code: 'CS',
        name: 'Computer Science',
        description: 'Computer Science Department'
      })
      .returning();

    if (!newDept) {
      throw new Error('Failed to create department');
    }

    console.log('✅ CREATE: New department created:', newDept);

    // READ: Select the department
    const foundDept = await index.select().from(departments).where(eq(departments.id, newDept.id));
    console.log('✅ READ: Found department:', foundDept[0]);

    // UPDATE: Change the department's name
    const [updatedDept] = await index
      .update(departments)
      .set({ name: 'Advanced Computer Science' })
      .where(eq(departments.id, newDept.id))
      .returning();

    if (!updatedDept) {
      throw new Error('Failed to update department');
    }

    console.log('✅ UPDATE: Department updated:', updatedDept);

    // DELETE: Remove the department
    await index.delete(departments).where(eq(departments.id, newDept.id));
    console.log('✅ DELETE: Department deleted.');

    console.log('\nCRUD operations completed successfully.');
  } catch (error) {
    console.error('❌ Error performing CRUD operations:', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('Database pool closed.');
    }
  }
}

main();