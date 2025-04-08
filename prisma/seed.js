// scripts/databaseCleanup.js
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import process from "node:process";

const prisma = new PrismaClient();

// Function to delete all sessions
async function deleteAllSessions() {
  try {
    console.log("🔄 Starting sessions cleanup...");
    const deleteResult = await prisma.session.deleteMany();
    console.log(`✅ Success! Deleted ${deleteResult.count} sessions`);
    return deleteResult.count;
  } catch (error) {
    console.error("❌ Error deleting sessions:", error);
    throw error;
  }
}

// Function to delete all users (except maybe admins)
async function deleteAllUsers() {
  try {
    console.log("🔄 Starting users cleanup...");
    const deleteResult = await prisma.user.deleteMany();
    console.log(`✅ Success! Deleted ${deleteResult.count} users`);
    return deleteResult.count;
  } catch (error) {
    console.error("❌ Error deleting users:", error);
    throw error;
  }
}

// Main cleanup function
async function main() {
  try {
    const tasks = process.argv.slice(2);
    console.log("🚀 Starting database cleanup...");

    const results = {};

    if (tasks.includes("sessions") || tasks.length === 0) {
      results.sessionsDeleted = await deleteAllSessions();
    }

    if (tasks.includes("users") || tasks.length === 0) {
      results.usersDeleted = await deleteAllUsers();
    }

    console.log("✨ Cleanup completed! Results:", results);
    return results;
  } catch (error) {
    console.error("🔥 Cleanup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
  }
}

// Execute only when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("Unhandled error:", e);
    process.exit(1);
  });
}
