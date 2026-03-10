const redisQueue = require('../redisqueue');

async function processJobsSequentially(dataArray, queueName, type, projectId, wantAiServices, services) {
  console.log(`Enqueuing ${type} jobs (${dataArray.length}) to ${queueName}`);
  for (const data of dataArray) {
    await redisQueue.add({
      queueName,
      type,
      data,
      projectId,
      wantAiServices,
      services
    });
    console.log(` → added ${type} job for`, data);
  }
  console.log(`All ${type} jobs enqueued to ${queueName}`);
}

async function waitForQueueCompletion(queueName) {
  let pending = true;
  while (pending) {
    const counts = await redisQueue.getJobCounts();
    const total = counts.waiting + counts.active + counts.delayed;
    console.log(`[${queueName}] pending jobs:`, total);
    if (total === 0) {
      pending = false;
    } else {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  console.log(`[${queueName}] fully processed`);
}

module.exports = { processJobsSequentially, waitForQueueCompletion };
