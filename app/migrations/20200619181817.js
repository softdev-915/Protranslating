const { Types: { ObjectId } } = global.mongoose || require('mongoose');
const _ = require('lodash');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then((connections) => connections.mongoose.connection)
  .then((db) => {
    const requestsCol = db.collection('requests');
    return new Promise((resolve, reject) => {
      const stream = requestsCol.find({ languageCombinations: { $exists: false } }).stream();
      stream.on('error', (err) => {
        reject(err);
      });
      stream.on('end', () => {
        resolve();
      });
      stream.on('data', (request) => {
        if (_.get(request, 'srcLang.name') && !_.isEmpty(_.get(request, 'tgtLangs', []))) {
          stream.pause();
          if (_.isNil(_.get(request, 'srcLang')) || _.isEmpty(_.get(request, 'tgtLangs'))) {
            stream.resume();
          }
          requestsCol.updateOne(
            { _id: request._id },
            {
              $set: {
                languageCombinationsText: `${request.srcLang.name} - ${request.tgtLangs.map((t) => t.name).join(', ')}`,
                languageCombinations: [{
                  _id: new ObjectId(),
                  srcLangs: [request.srcLang],
                  tgtLangs: request.tgtLangs,
                  documents: _.get(request, 'documents', []),
                }],
                'workflows.$[].srcLang': request.srcLang,
              },
              $unset: {
                srcLang: true,
              },
            },
          )
            .then(() => requestsCol.findOne({ _id: request._id })
              .then((dbRequest) => {
                if (_.get(dbRequest, 'workflows', [])) {
                  dbRequest.workflows = dbRequest.workflows.map((w) => {
                    if (_.isNil(w.language)) {
                      if (dbRequest.tgtLangs.length > 0) {
                        w.tgtLang = {
                          name: dbRequest.tgtLangs[0].name,
                          isoCode: dbRequest.tgtLangs[0].isoCode,
                        };
                      }
                    } else {
                      w.tgtLang = w.language;
                    }
                    delete w.language;
                    return w;
                  });

                  let finalDocuments = dbRequest.documents.filter((d) => d.final === true);
                  if (dbRequest.workflows.length > 0) {
                    dbRequest.workflows.forEach((w) => {
                      w.tasks.forEach((t) => {
                        t.providerTasks.forEach((pt) => {
                          if (t.ability === 'Validation and Delivery' && pt.status === 'completed') {
                            if (!_.isEmpty(pt.files)) {
                              pt.files.forEach((file) => {
                                finalDocuments = finalDocuments.map((finalDoc) => {
                                  if (finalDoc._id.toString() === file._id.toString()) {
                                    finalDoc.srcLang = w.srcLang;
                                    finalDoc.tgtLang = w.tgtLang;
                                  }
                                  return finalDoc;
                                });
                              });
                            }
                          }
                        });
                      });
                    });
                  }
                  requestsCol.updateOne(
                    { _id: request._id },
                    {
                      $set: {
                        workflows: dbRequest.workflows,
                        finalDocuments,
                      },
                      $unset: {
                        documents: 1,
                        tgtLangs: 1,
                      },
                    },
                  )
                    .then(() => stream.resume());
                }
              }));
        } else {
          stream.resume();
        }
      });
    });
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
