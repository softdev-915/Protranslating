const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const countriesToUpdate = [{
  oldName: 'Viet Nam',
  newName: 'Vietnam',
},
{
  oldName: 'Venezuela, Bolivarian Republic of',
  newName: 'Venezuela',
},
{
  oldName: 'Holy See (Vatican City State)',
  newName: 'Vatican City State',
},
{
  oldName: 'United States Minor Outlying Islands',
  newName: 'US Minor Outlying Islands',
},
{
  oldName: 'Taiwan, Province of China',
  newName: 'Taiwan',
},
{
  oldName: 'Sint Maarten (Dutch part)',
  newName: 'Sint Maarten',
},
{
  oldName: 'Saint Helena, Ascension and Tristan da Cunha',
  newName: 'Saint Helena',
},
{
  oldName: 'Réunion',
  newName: 'Reunion',
},
{
  oldName: 'Palestine, State of',
  newName: 'Palestinian Territory, Occupied',
},
{
  oldName: 'Macedonia, the Former Yugoslav Republic of',
  newName: 'Macedonia',
},
{
  oldName: 'Saint Martin(French part)',
  newName: 'Saint Martin',
},
{
  oldName: 'Libya',
  newName: 'Libyan Arab Jamahiriya',
},
{
  oldName: "Lao People's Democratic Republic",
  newName: 'Lao',
},
{
  oldName: "Korea, Democratic People's Republic of",
  newName: "Korea, Demo. People's Rep",
},
{
  oldName: 'Heard Island and McDonald Islands',
  newName: 'Heard Is. & Mcdonald Islands',
},
{
  oldName: 'South Georgia and the South Sandwich Islands',
  newName: 'S.Georgia & S.Sandwich Is',
}, {
  oldName: 'Micronesia, Federated States of',
  newName: 'Micronesia',
}, {
  oldName: 'Congo, the Democratic Republic of the',
  newName: 'Congo, Democratic Republic',
},
{
  oldName: 'Bolivia, Plurinational State of',
  newName: 'Bolivia',
}, {
  oldName: 'Saint Barthélemy',
  newName: 'Saint Barthelemy',
},
{
  oldName: 'Åland Islands',
  newName: 'Aland Islands',
},
];

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const countryCol = db.collection('countries');
    return Promise.map(countriesToUpdate, country => countryCol.updateOne({
      name: country.oldName,
    }, {
      $set: {
        name: country.newName,
      },
    }));
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
