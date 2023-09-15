const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

let requestsCollection;
/**
 * Finds a provider task's final document by id.
 * @param {Object} request the request matched.
 * @param {String} _id the finalDocumentId string.
 */
const _findDocument = (request, _id) => {
  if (request && request.workflows && request.workflows.length) {
    return request.workflows.find((w) => {
      if (w.tasks && w.tasks.length) {
        return w.tasks.find((t) => {
          if (t.ability && t.ability.toLowerCase() === 'validation and delivery' && t.providerTasks && t.providerTasks.length) {
            return t.providerTasks.find((pt) => {
              if (pt.files && pt.files.length && pt.status === 'completed') {
                return pt.files.find(f => f._id.toString() === _id);
              }
              return false;
            });
          }
          return false;
        });
      }
      return false;
    });
  }
  return null;
};

/**
 * _processRequestFactory creates the callback function for cursor.next
 * @param {Object} req request object.
 * @returns {Promise} resolved when finished processing the request.
 */
const _processRequestFactory = async (req) => {
  let updateNeeded = false;
  if (req.documents && req.documents.length) {
    req.documents.forEach((doc) => {
      if (doc.final) {
        updateNeeded = true;
        const isDocumentCompleted = _findDocument(req, doc._id.toString());
        if (isDocumentCompleted) {
          if (doc.completed !== true) {
            doc.completed = true;
            updateNeeded = true;
          }
        } else if (doc.completed !== false) {
          doc.completed = false;
          updateNeeded = true;
        }
      }
    });
    if (updateNeeded) {
      await requestsCollection.update({ _id: req._id },
        { $set: { documents: req.documents } });
    }
  }
};

/**
 *
 * @param {Object} cursor request collection query cursor.
 */
const _exhaustCursor = async (cursor) => {
  // eslint-disable-next-line no-await-in-loop
  while (await cursor.hasNext()) {
    // eslint-disable-next-line no-await-in-loop
    const request = await cursor.next();
    // eslint-disable-next-line no-await-in-loop
    await _processRequestFactory(request);
  }
};

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    requestsCollection = db.collection('requests');
    const cursor = requestsCollection.find({
      'documents.final': true,
    });
    return _exhaustCursor(cursor);
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
