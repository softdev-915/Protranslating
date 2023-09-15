const fs = require('fs');
const bson = require('bson');
const moment = require('moment');
const Promise = require('bluebird');
const parse = require('csv-parse/lib/sync');
const { Types: { ObjectId } } = require('mongoose');
const mongo = require('../../../components/database/mongo');
const configuration = require('../../../components/configuration');

const USAGE = `
  Usage: node index.js csv/file/path
  CSV must contain two columns: CollectionName, ObjectId
`;
const outputFolder = moment().format('MM-DD');
const main = async () => {
  try {
    const [csvFilepath] = process.argv.slice(2);
    const { mongoose: { connection: db } } = await mongo.connect(configuration);

    if (!fs.existsSync(csvFilepath)) {
      console.log(USAGE);
      throw new Error(`File ${csvFilepath} does not exist`);
    }
    const csvData = fs.readFileSync(csvFilepath, 'utf8');
    const records = parse(csvData, { skip_empty_lines: true, delimiter: ',' });
    await Promise.mapSeries(records.slice(1), async ([collectionName, id]) => {
      id = id.trim();
      const _id = new ObjectId(id);
      const collection = db.collection(collectionName);
      const record = await collection.findOne({ _id });
      if (!record) {
        console.log(`${collectionName} ${id} not found`);
        return;
      }
      const ouputFolderPath = `${__dirname}/${outputFolder}`;
      const outputFilePath = `${ouputFolderPath}/${collectionName}-${id}.bson`;
      if (!fs.existsSync(ouputFolderPath)) {
        fs.mkdirSync(ouputFolderPath);
      }
      fs.writeFileSync(outputFilePath, bson.serialize(record));
      await collection.deleteOne({ _id });
      console.log(`${collectionName} ${id} removed and backed up: ${outputFilePath}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
};

main().then(() => process.exit());
