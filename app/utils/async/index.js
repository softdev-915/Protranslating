const _ = require('lodash');

/**
 * Awaits until conditon `fn` returns true for `options.timeoutMs` milliseconds
 * and returns a promise which is resolved when the condition is met
 * and rejected with `options.message` error otherwise.
 * @param {Function} fn Function to check the condition. Returns Boolean or Promise of a Boolean
 * @param {String} options.message Error message when condition is not met
 * @param {Number} options.timeoutMs Milliseconds to wait until the condition considered not met
 * @param {Number} options.intervalMs Milliseconds between condition check
 * @returns Promise
 */
const awaitCondition = (fn, {
  message = 'Condition was not reached',
  timeoutMs = 60000,
  intervalMs = 3000,
}) => (
  new Promise((resolve, reject) => {
    const timerId = setInterval(() => {
      Promise.resolve(fn())
        .then((result) => {
          timeoutMs -= intervalMs;
          if (!_.isBoolean(result)) {
            throw new Error('Function did not return a boolean value. Only Boolean or Promise of a Boolean are supported');
          }
          const shouldClearInterval = result || timeoutMs <= 0;
          if (shouldClearInterval) {
            clearInterval(timerId);
            if (result) {
              return resolve(result);
            }
            reject(new Error(message));
          }
        })
        .catch((e) => {
          clearInterval(timerId);
          reject(e);
        });
    }, intervalMs);
  })
);

module.exports = { awaitCondition };
