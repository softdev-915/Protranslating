/* eslint-disable no-console */
/* eslint-disable no-continue */
/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
const util = require('node:util');

const exec = util.promisify(require('node:child_process').exec);
const { simpleGit } = require('simple-git');
const { setTimeout: sleep } = require('timers/promises');
// const axios = require('axios');
const moment = require('moment');

const LMS_SPA_ROOT = process.env.LMS_SPA_ROOT || '/home/ubuntu/lms-spa';
const DELAY = 1000 * 60 * 5;
const signalStatus = async (status, message, logs) => {
  console.log(message);
  if (logs) {
    console.log('Here\'s logs:');
    console.log(logs);
  }
  // return axios.post('http://35.227.11.173:3030/api/deployment-status', { status, message });
};
const execute = async ({
  command, errorMessage, cwd = LMS_SPA_ROOT, silent = false,
}) => {
  try {
    const { stdout, stderr } = await exec(command, { cwd });
    if (stderr && !silent) {
      const message = `STDERR: ${errorMessage}\n${stderr}`;
      await signalStatus('failed', message);
      throw new Error(message);
    }
    return stdout;
  } catch (error) {
    const message = `${errorMessage}\n${error}`;
    await signalStatus('failed', message);
    throw new Error(message);
  }
};

const git = simpleGit({
  baseDir: LMS_SPA_ROOT,
  binary: 'git',
  trimmed: false,
});

(async () => {
  while (true) {
    await sleep(DELAY);
    const { summary } = await git.pull();
    const noChanges = !summary.changes && !summary.deletions && !summary.insertions;
    if (noChanges) console.log('Nothing to redeploy');
    if (noChanges) continue;
    const startTime = moment();
    await signalStatus(
      'started',
      `The deployment has started at ${startTime.format('HH:mm:ss MM-DD-YYYY')}`,
    );
    await signalStatus('progress', 'Stopping active backend...');
    const beStoppingLogs = await execute({
      command: 'pm2 stop spa-back && pm2 delete spa-back',
      errorMessage: 'Backend was failed to stop.',
    });
    await signalStatus(
      'progress',
      'The backend was successfully stopped.',
      beStoppingLogs,
    );
    await signalStatus('progress', 'Starting backend...');
    const beStartingLogs = await execute({
      command: 'pm2 start -i 10 --name "spa-back" app/lms.js --node-args="--max-old-space-size=4000"',
      errorMessage: 'Backend was failed to start.',
    });
    await signalStatus('progress', 'The backend was started.', beStartingLogs);
    await signalStatus('progress', 'Rebuilding frontend...');
    const feStartingLogs = await execute({
      command: 'rm -rf dist && npm run build',
      errorMessage: 'Frontend failed to restart.',
      cwd: `${LMS_SPA_ROOT}/frontend`,
      silent: true,
    });
    await signalStatus('progress', 'The frontend was rebuilt.', feStartingLogs);
    await execute({
      command: 'sudo systemctl restart nginx',
      errorMessage: 'Nginx was failed to restart',
    });
    const endTime = moment();
    const tookTime = moment.duration(endTime.diff(startTime)).asMilliseconds();
    await signalStatus(
      'finished',
      `The deployment has ended at ${endTime.format('HH:mm:ss MM-DD-YYYY')}.
      Took ${moment(tookTime).format('mm [minutes] ss [seconds]')}`,
    );
  }
})();
