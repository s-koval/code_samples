// @ts-ignore
import { scheduleJob } from 'node-schedule';
import parseMessages from "./parseMessages";

const wrapJob = (job: any) => {
  return async () => {
    try {
      console.log('Executing a job...');

      await job();

      console.log('Successfully finished a job.');
    } catch (error) {
      console.error(`Failed to execute a job with the following error: [${error}]`);
    }
  };
}

export const runScheduler = () => {
  // daily at 1:00 AM
  // scheduleJob(
  //   "Set the status of a user to 'idle' after some time of inactivity",
  //   '* 1 * * *',
  //   // wrapJob(changeInactiveUserStatus)
  // );

  // every 15 minutes
  // scheduleJob(
  //   "Notify users about new messages",
  //   '* * * * *',
  //   wrapJob(notifyAboutNewMessages)
  // );


  // every 1 minute
  scheduleJob(
    "Parse SNS new messages",
    '* * * * *',
    wrapJob(parseMessages)
  );
  // every 1 minute
  // scheduleJob(
  //   "Notify users about receive money from Stellar",
  //   '* * * * *',
  //   wrapJob(notifyAboutNewReceiveMoneyFromStellar)
  // );
};
