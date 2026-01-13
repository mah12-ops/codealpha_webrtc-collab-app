const { mysqlTable, int, varchar, text, timestamp } = require('drizzle-orm/mysql-core');

const rooms = mysqlTable('rooms', {
  // Use 'int' instead of 'serial' for better MariaDB compatibility
  id: int('id').autoincrement().primaryKey(),
  roomId: varchar('room_id', { length: 255 }).unique().notNull(),
  adminId: varchar('admin_id', { length: 255 }), 
  whiteboardData: text('whiteboard_data'), 
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { rooms };