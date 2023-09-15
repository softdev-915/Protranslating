/* eslint-disable no-restricted-syntax */
const _ = require('lodash');
const Promise = require('bluebird');
const { Types } = require('mongoose');
const { loadSchemas, models: mongooseSchema } = require('../../components/database/mongo');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

const main = async () => {
  try {
    await mongo.connect(configuration);
    await loadSchemas();
    console.log('Counting total ar invoices');
    const totalInvoicesToUpdate = await mongooseSchema.ArInvoice.find({
      $or: [
        { 'entries.workflowId': { $exists: false } },
        { 'entries.workflowDescription': { $exists: false } },
      ],
    }).countDocuments();
    const cursor = mongooseSchema.ArInvoice.find({
      $or: [
        { 'entries.workflowId': { $exists: false } },
        { 'entries.workflowDescription': { $exists: false } },
      ],
    }).cursor({ batchSize: 100, noCursorTimeout: true });
    let updatesCount = 0;
    let processed = 0;

    setInterval(() => {
      console.log(`Total invoices to process: ${totalInvoicesToUpdate - processed}. Updates count: ${updatesCount}. Progress: ${(processed / totalInvoicesToUpdate) * 100}%`);
    }, 2000);

    console.log('Starting process');
    await cursor.eachAsync(async (invoice) => {
      await Promise.mapSeries(invoice.entries, async (entry) => {
        const workflowPath = '$workflows';
        const tasksPath = `${workflowPath}.tasks`;
        const invoiceDetailsPath = `${tasksPath}.invoiceDetails`;
        const request = await mongooseSchema.Request.aggregate([
          {
            $match: {
              _id: entry.requestId,
            },
          },
          { $unwind: workflowPath },
          { $unwind: tasksPath },
          {
            $match: {
              'workflows.tasks._id': entry.taskId,
            },
          },
          { $unwind: invoiceDetailsPath },
          {
            $match: {
              'workflows.tasks.invoiceDetails.invoice._id': entry._id,
            },
          },
          {
            $addFields: {
              workflowId: `${workflowPath}._id`,
              workflowDescription: `${workflowPath}.description`,
            },
          },
          {
            $project: {
              workflowId: 1,
              workflowDescription: 1,
            },
          },
        ]);
        if (request.length > 0) {
          await mongooseSchema.ArInvoice.updateOne(
            { _id: invoice._id },
            { $set:
              {
                'entries.$[entry].workflowId': _.get(request, '[0].workflowId'),
                'entries.$[entry].workflowDescription': _.get(request, '[0].workflowDescription', ''),
              },
            }, {
              arrayFilters: [
                { 'entry._id': new Types.ObjectId(entry._id) },
              ],
            });
        }
        updatesCount++;
      });
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
