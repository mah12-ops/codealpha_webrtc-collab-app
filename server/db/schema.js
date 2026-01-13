import { mysqlTable, serial, varchar, text, boolean, timestamp, int } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull(),
  password: text('password').notNull(),
});

export const rooms = mysqlTable('rooms', {
  id: serial('id').primaryKey(),
  roomId: varchar('room_id', { length: 255 }).unique().notNull(),
  adminId: int('admin_id').references(() => users.id),
  whiteboardData: text('whiteboard_data'), // Stores JSON of canvas
  isLocked: boolean('is_locked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});