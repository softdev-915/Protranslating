const _ = require('lodash');
const { loadSchemas, default: mongooseSchema } = require('../../components/database/mongo/schemas/index.js');
const mongo = require('../../components/database/mongo/index.js');
const configuration = require('../../components/configuration/index.js');

const main = async () => {
  try {
    await mongo.connect(configuration);
    await loadSchemas();
    console.log('Counting total epo requests');
    const totalRequestToUpdate = await mongooseSchema.Request.find({
      'ipPatent.patentApplicationNumber': {
        $exists: true,
      },
    }).countDocuments();
    const cursor = mongooseSchema.Request.find({
      'ipPatent.patentApplicationNumber': {
        $exists: true,
      },
    }).cursor({ batchSize: 100 });
    let processed = 0;
    let updatesCount = 0;

    setInterval(() => {
      console.log(`Total requests to process: ${totalRequestToUpdate - processed}.
      Updates count: ${updatesCount}. Progress: ${(processed / totalRequestToUpdate) * 100}%`);
    }, 2000);

    console.log('Starting process to update all epo requests with a validation deadlone');
    await cursor.eachAsync(async (request) => {
      const epo = await mongooseSchema.Epo.findOne({
        patentApplicationNumber: _.get(request, 'ipPatent.patentApplicationNumber'),
      });
      const patentPublicationNumber = _.get(epo, 'patentPublicationNumber');
      if (/^EP[0-9]{7}/.test(patentPublicationNumber)) {
        await mongooseSchema.Request.updateOne(
          { _id: request._id },
          { $set:
            {
              'ipPatent.patentPublicationNumber': patentPublicationNumber,
              'ipPatent.validationDeadline': _.get(epo, 'validationDeadline', ''),
            },
          });
        updatesCount++;
      }
      processed++;
    });
  } catch (e) {
    console.log(`Error ${e}`);
  }
};

main().then(() => {
  console.log('Finished process');
  process.exit();
});
