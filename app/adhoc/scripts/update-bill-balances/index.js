const fs = require('fs');
const Promise = require('bluebird');
const parse = require('csv-parse/lib/sync');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const mongo = require('../../../components/database/mongo');
const configuration = require('../../../components/configuration');
const { loadSchemas, default: mongooseSchema } = require('../../../components/database/mongo').models;

const USAGE = `
  Updates LV bills amounts based on csv exported from SI
  Usage: node index.js csv/file/path
  CSV must contain columns: bill number, record number, total due, total amount, total paid
`;
const main = async () => {
  try {
    await mongo.connect(configuration);
    await loadSchemas();
    const [csvFilepath] = process.argv.slice(2);

    if (!fs.existsSync(csvFilepath)) {
      throw new Error(`File ${csvFilepath} does not exist`);
    }
    const csvData = fs.readFileSync(csvFilepath, 'utf8');
    const records = parse(csvData, { skip_empty_lines: true, delimiter: ',' });
    const errors = [];
    await Promise.mapSeries(records.slice(1), async ([no, recordNo, balance,
      totalAmount, amountPaid]) => {
      balance = parseFloat(balance);
      totalAmount = parseFloat(totalAmount);
      amountPaid = parseFloat(amountPaid);
      try {
        const doc = await mongooseSchema.Bill.findOneAndUpdate(
          { no },
          { totalAmount, amountPaid, balance },
        );
        if (!doc) {
          throw new Error('Not found');
        }
      } catch (e) {
        console.error(`Bill ${no} was not updated because of an error ${e}`);
        errors.push({
          no, recordNo, balance, totalAmount, amountPaid,
        });
      }
    });
    if (errors.length > 0) {
      const errorCsvFilepath = `error-${csvFilepath}`;
      await createCsvWriter({
        path: errorCsvFilepath,
        header: [
          { id: 'no', title: 'no' },
          { id: 'recordNo', title: 'recordNo' },
          { id: 'balance', title: 'balance' },
          { id: 'totalAmount', title: 'totalAmount' },
          { id: 'amountPaid', title: 'amountPaid' },
        ],
      }).writeRecords(errors);
      console.log(`All errored records are written in ${errorCsvFilepath}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
};

main().then(() => process.exit());
