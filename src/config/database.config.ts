import { registerAs } from "@nestjs/config";

export default registerAs("database", () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 27017,
  name: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  seedUsers: [
    {
      first_name: "Admin",
      last_name: "User",
      email: "admin@example.com",
      phone_number: "+1234567890",
      password: "admin123",
      role: "ADMIN"
    },
    {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      phone_number: "+1234567891",
      password: "user123",
      role: "USER"
    },
    {
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      phone_number: "+1234567892",
      password: "user123",
      role: "USER"
    },
    {
      first_name: "Alice",
      last_name: "Johnson",
      email: "alice@example.com",
      phone_number: "+1234567893",
      password: "user123",
      role: "USER"
    },
    {
      first_name: "Bob",
      last_name: "Wilson",
      email: "bob@example.com",
      phone_number: "+1234567894",
      password: "user123",
      role: "USER"
    },
    {
      first_name: "Carol",
      last_name: "Brown",
      email: "carol@example.com",
      phone_number: "+1234567895",
      password: "user123",
      role: "USER"
    }
  ],
  postgres: {
    enableSSL: process.env.ENABLE_SQL_SSL ? process.env.ENABLE_SQL_SSL : false,
  },
}));
