import fs from "fs";
import path from "path";
import prisma from "../../src/lib/prisma";

/**
 * Saves the provided data to a JSON file in the backup directory.
 * The filename includes a datestamp.
 */
function saveBackupToFile(data: unknown, backupDir = "backup") {
  const dateStamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const fileName = `backup_${dateStamp}.json`;
  const fullDirPath = path.resolve(__dirname, backupDir);
  const fullFilePath = path.join(fullDirPath, fileName);

  // Ensure the backup directory exists
  if (!fs.existsSync(fullDirPath)) {
    fs.mkdirSync(fullDirPath, {recursive: true});
  }

  fs.writeFileSync(fullFilePath, JSON.stringify(data, null, 2), "utf-8");
  return fullFilePath;
}

/**
 * Creates a backup of users and saves it to a JSON file.
 */
async function createBackup() {
  console.log(`[${new Date().toISOString()}] 📦 Starting database backup...`);

  try {
    const users = await prisma.user.findMany();
    const accounts = await prisma.account.findMany();
    const customers = await prisma.customer.findMany();
    const hairOrders = await prisma.hairOrder.findMany();
    const appointments = await prisma.appointment.findMany();
    const appointmentNotes = await prisma.appointmentNote.findMany();
    const appointmentPersonnel = await prisma.personnelOnAppointments.findMany();
    const transactions = await prisma.transaction.findMany();
    const hairOrderNotes = await prisma.hairOrderNote.findMany();
    const hair = await prisma.hair.findMany();

    const filePath = saveBackupToFile({
      tables: {
        users,
        accounts,
        customers,
        transactions,
        appointments,
        appointmentNotes,
        appointmentPersonnel,
        hairOrders,
        hairOrderNotes,
        hair
      }
    });
    console.log(`[${new Date().toISOString()}] ✅ Backup saved to: ${filePath}`);
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ❌ Error backing up database:\n`, error.message);
    console.error("📍 Stack trace:\n", error.stack);
    if (error.meta) {
      console.error("📍 Meta:\n", error.meta);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log(`[${new Date().toISOString()}] 🔌 Disconnected from database.`);
  }
}

createBackup();
