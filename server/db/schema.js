const { mysqlTable, serial, varchar, text, timestamp } = require('drizzle-orm/mysql-core');

const rooms = mysqlTable('rooms', {
  id: serial('id').primaryKey(),
  roomId: varchar('room_id', { length: 255 }).unique().notNull(),
  adminId: varchar('admin_id', { length: 255 }), // socket.id of the creator
  whiteboardData: text('whiteboard_data'), // Stores the canvas state
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { rooms };