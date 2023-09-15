/**
 * pipeWithErrors pipes two streams and in the case of an error
 * it will emit an error that will reach to the whole chain of
 * pipes. Otherwise with a simple pipe, the error will not reach
 * to the last pipe.
 */
const pipeWithErrors = (src, dest) => {
  src.pipe(dest);
  src.once('error', (err) => {
    dest.emit('error', err);
  });
  return dest;
};

function streamToBuffer(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

module.exports = {
  pipeWithErrors,
  streamToBuffer,
};
