// scheduler.js
const cron = require("node-cron");
const Blog = require("../models/blogs"); // adjust path if needed

// Run every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const result = await Blog.updateMany(
      {
        isSchedule: true,
        status: 0, // draft
        scheduleTime: { $lte: now }
      },
      {
        $set: {
          status: 1,        // published
          isSchedule: false // clear flag
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Scheduler] Published ${result.modifiedCount} blogs at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error("[Scheduler] Error while publishing blogs:", err.message);
  }
});
