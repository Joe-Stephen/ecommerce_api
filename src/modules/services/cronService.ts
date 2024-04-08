const nodeCron = require("node-cron");

export const cronJob = async (task: any) => {
  nodeCron.schedule("*/1 * * * *", task);
};
