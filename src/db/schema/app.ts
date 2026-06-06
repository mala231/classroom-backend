import {integer, pgTable, timestamp, varchar} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";
const timestamps =
    {
        createdAt : timestamp('created_at').defaultNow().notNull(),
        updatedAt : timestamp('updated_at').defaultNow().$onUpdate(( )=> new Date()).notNull()
    }

export const departments = pgTable('departments',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        code: varchar('code',{length: 50}).notNull().unique(),
        name: varchar('name',{length: 255}).notNull(),
        description: varchar('description',{length: 255}),
        ...timestamps
    }
)

export const subjects = pgTable('subjects',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        departmentId: integer('department_id').notNull().references(() => departments.id,{ onDelete : 'restrict'}),
        name: varchar('name',{length: 255}).notNull(),
        code: varchar('code',{length: 50}).notNull().unique(),
        description: varchar('description',{length: 255}),
        ...timestamps
    }
)

export const users = pgTable('users',
    {
        id: varchar('id', { length: 255 }).primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),
        email: varchar('email', { length: 255 }).notNull().unique(),
        role: varchar('role', { length: 50 }).notNull(),
        image: varchar('image', { length: 255 }),
        imageCldPubId: varchar('image_cld_pub_id', { length: 255 }),
        department: varchar('department', { length: 255 }),
        ...timestamps
    }
)

export const classes = pgTable('classes',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        name: varchar('name', { length: 255 }).notNull(),
        description: varchar('description', { length: 255 }),
        capacity: integer('capacity').notNull(),
        status: varchar('status', { length: 50 }).notNull().default('active'),
        inviteCode: varchar('invite_code', { length: 50 }).unique(),
        bannerUrl: varchar('banner_url', { length: 255 }),
        bannerCldPubId: varchar('banner_cld_pub_id', { length: 255 }),
        subjectId: integer('subject_id').notNull().references(() => subjects.id, { onDelete: 'restrict' }),
        teacherId: varchar('teacher_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'restrict' }),
        ...timestamps
    }
)

export const schedules = pgTable('schedules',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
        day: varchar('day', { length: 50 }).notNull(),
        startTime: varchar('start_time', { length: 50 }).notNull(),
        endTime: varchar('end_time', { length: 50 }).notNull(),
        ...timestamps
    }
)

export const enrollments = pgTable('enrollments',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
        studentId: varchar('student_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
        ...timestamps
    }
)

export const departmentRelations = relations(departments, ({many}) => ({ subjects: many(subjects)
}))

export const subjectsRelations = relations(subjects, ({one, many}) => ({ department: one(departments, {
                fields: [subjects.departmentId],
                references: [departments.id],

        }
),
    classes: many(classes)
}))

export const usersRelations = relations(users, ({ many }) => ({
    classes: many(classes),
    enrollments: many(enrollments),
}))

export const classesRelations = relations(classes, ({ one, many }) => ({
    subject: one(subjects, {
        fields: [classes.subjectId],
        references: [subjects.id],
    }),
    teacher: one(users, {
        fields: [classes.teacherId],
        references: [users.id],
    }),
    schedules: many(schedules),
    enrollments: many(enrollments),
}))

export const schedulesRelations = relations(schedules, ({ one }) => ({
    class: one(classes, {
        fields: [schedules.classId],
        references: [classes.id],
    }),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    class: one(classes, {
        fields: [enrollments.classId],
        references: [classes.id],
    }),
    student: one(users, {
        fields: [enrollments.studentId],
        references: [users.id],
    }),
}))

export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert
export type Subject = typeof subjects.$inferSelect
export type NewSubject = typeof subjects.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Class = typeof classes.$inferSelect
export type NewClass = typeof classes.$inferInsert
export type Schedule = typeof schedules.$inferSelect
export type NewSchedule = typeof schedules.$inferInsert
export type Enrollment = typeof enrollments.$inferSelect
export type NewEnrollment = typeof enrollments.$inferInsert