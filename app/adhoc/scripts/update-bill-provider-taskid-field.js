/* eslint-disable no-await-in-loop */
const Promise = require('bluebird');
const _ = require('lodash');
const mongo = require('../../components/database/mongo');
const configuration = require('../../components/configuration');

async function runSanityCheck(billsCol, requestsCol) {
  let migratedTasks = 0;
  console.log('Starting sanity check process');
  const cursor = await billsCol.aggregate([
    {
      $match: {
        providerTasksIdList: { $exists: true },
      },
    },
    {
      $unwind: '$providerTasksIdList',
    },
    {
      $project: { _id: 1, no: 1, providerTasksIdList: 1 },
    },
  ]);
  while (await cursor.hasNext()) {
    const bill = await cursor.next();
    const requestFound = await requestsCol.findOne({
      _id: bill.providerTasksIdList.requestId,
      'workflows._id': bill.providerTasksIdList.workflowId,
      'workflows.tasks._id': bill.providerTasksIdList.taskId,
      'workflows.tasks.providerTasks._id': bill.providerTasksIdList.providerTaskId,
    }, { _id: 1 });
    if (_.isNil(requestFound)) {
      console.log(`Bill with _id ${bill._id} has wrong information`);
    } else {
      migratedTasks++;
    }
  }
  if (migratedTasks === 0) {
    throw new Error('No tasks were migrated');
  } else {
    console.log('Finished process');
  }
}

async function getBillsToUpdate(billsCol) {
  return await billsCol.aggregate([
    {
      $match: {
        requests: { $exists: true },
        $expr: {
          $gte: [{ $size: '$requests' }, 1],
        },
      },
    },
    {
      $project: {
        _id: 1,
        providerTaskIds: 1,
        providerTasksIdList: 1,
        requests: 1,
        providerTaskIdsToUpdate: {
          $cond: {
            if: { $eq: ['$providerTaskIds', null] },
            then: [],
            else: {
              $setDifference: [
                { $ifNull: ['$providerTaskIds', []] }, // Handle null for providerTaskIds
                { $ifNull: ['$providerTasksIdList.providerTaskId', []] }, // Handle null for providerTasksIdList.providerTaskId
              ],
            },
          },
        },
      },
    },
    {
      $match: {
        $expr: { $gte: [{ $size: '$providerTaskIdsToUpdate' }, 1] },
      },
    },
    {
      $unwind: '$requests',
    },
    {
      $project: {
        _id: 1,
        providerTaskIdsToUpdate: 1,
        providerTasksIdList: 1,
        providerTaskIds: 1,
        requests: 1,
      },
    },
  ]);
}

async function findProviderTaskParallel(workflows, providerTaskIds, requestId) {
  const tasksPromises = workflows.map(async (workflow) => {
    const tasks = workflow.tasks;
    // eslint-disable-next-line no-restricted-syntax
    for (const task of tasks) {
      const providerTask = task.providerTasks.find(
        pt => providerTaskIds.find(ptId => ptId.toString() === pt._id.toString()),
      );
      if (providerTask) {
        return {
          requestId,
          taskId: task._id,
          workflowId: workflow._id,
          providerTaskId: providerTask._id,
        };
      }
    }
    return null;
  });
  const tasksResults = await Promise.all(tasksPromises);
  return tasksResults.filter(_.isObject);
}

async function countTasksLeft(billsCol) {
  const tasksLeftAggregation = await billsCol.aggregate([
    {
      $match: {
        requests: { $exists: true },
        $expr: {
          $gte: [{ $size: '$requests' }, 1],
        },
      },
    },
    {
      $project: {
        _id: 1,
        requests: 1,
        providerTaskIdsToUpdate: {
          $cond: {
            if: { $eq: ['$providerTaskIds', null] },
            then: [],
            else: {
              $setDifference: [
                { $ifNull: ['$providerTaskIds', []] }, // Handle null for providerTaskIds
                { $ifNull: ['$providerTasksIdList.providerTaskId', []] }, // Handle null for providerTasksIdList.providerTaskId
              ],
            },
          },
        },
      },
    },
    {
      $match: {
        $expr: { $gte: [{ $size: '$providerTaskIdsToUpdate' }, 1] },
      },
    },
    {
      $group: { _id: null, providerTaskIdsToUpdate: { $sum: 1 } },
    },
  ]).toArray();

  if (tasksLeftAggregation.length === 0) {
    return 0;
  }
  const tasksLeftCount = tasksLeftAggregation[0].providerTaskIdsToUpdate;
  return tasksLeftCount;
}

async function removeReferencesToNonexistentProviderTasks(billsCol, bill, foundProviderTasks) {
  const referencesToRemove = _.differenceWith(bill.providerTaskIdsToUpdate, foundProviderTasks,
    (ref, { providerTaskId }) => ref === providerTaskId,
  );
  if (_.isEmpty(referencesToRemove)) {
    return;
  }
  console.log(`References to remove: ${referencesToRemove.join(', ')} from the bill ${bill._id}`);
  await billsCol.updateOne({ _id: bill._id }, {
    $pullAll: { providerTaskIds: referencesToRemove },
  });
}

async function updateBills(billsCol, requestsCol, cursor, failedBills, processProgress) {
  while (await cursor.hasNext()) {
    const bill = await cursor.next();
    const billRequests = await requestsCol.find(
      { _id: { $in: [bill.requests._id] } },
      { 'workflows._id': 1, 'workflows.tasks._id': 1, 'workflows.tasks.providerTasks._id': 1 },
    ).toArray();
    // eslint-disable-next-line no-loop-func
    await Promise.map(billRequests, async (request) => {
      const foundProviderTasks = await findProviderTaskParallel(request.workflows,
        bill.providerTaskIdsToUpdate, request._id);
      if (!_.isEmpty(foundProviderTasks)) {
        const updatedBill = await billsCol.updateOne(
          {
            _id: bill._id,
          },
          {
            $push: {
              providerTasksIdList: { $each: foundProviderTasks },
            },
          });
        if (updatedBill && updatedBill.result.nModified === 1) {
          const providerTasksLeftForBill = bill.providerTaskIds.length -
            bill.providerTasksIdList.length;
          if (providerTasksLeftForBill === 1) {
            processProgress.billsCount += 1;
          }
        } else {
          throw new Error(`Failed to update bill with _id ${bill._id}: ${JSON.stringify(updatedBill)}`);
        }
      } else {
        failedBills.push(bill._id.toString());
      }
      await removeReferencesToNonexistentProviderTasks(billsCol, bill, foundProviderTasks);
    }, { concurrency: 5 });
  }
}

const main = async () => {
  const processProgress = {
    billsCount: 0,
  };
  const failedBills = [];
  const connections = await mongo.connect(configuration);
  const connection = await connections.mongoose.connection;
  const billsCol = connection.collection('bills');
  const requestsCol = connection.collection('requests');
  setInterval(async () => {
    const billsLeftCount = await billsCol.find({ 'providerTasksIdList.0': { $exists: false } }).count();
    console.log(`Processed: ${processProgress.billsCount} of ${billsLeftCount}`);
  }, 1000 * 10);
  console.log('Starting process...');
  console.log('Setting providerTasksIdList field for all bills...');
  await billsCol.updateMany(
    {
      requests: { $exists: true },
      $expr: {
        $gte: [{ $size: '$requests' }, 1],
      },
      providerTasksIdList: { $exists: false },
    },
    {
      $set: {
        providerTasksIdList: [],
      },
    });
  try {
    console.log('Getting bills to update...');
    const cursor = await getBillsToUpdate(billsCol);
    await updateBills(billsCol, requestsCol, cursor, failedBills, processProgress);
    const tasksLeftCount = await countTasksLeft(billsCol);
    if (tasksLeftCount > 0) {
      if (failedBills.length < 100) {
        console.log(`Bills that failed: ${_.uniq(failedBills).join(', ')}`);
      }
      throw new Error(`Provider tasks left: ${tasksLeftCount}: Please re run the script`);
    }
    return await runSanityCheck(billsCol, requestsCol);
  } catch (e) {
    console.log(`Failed with error ${e}`);
  }
};

main().then(process.exit);
