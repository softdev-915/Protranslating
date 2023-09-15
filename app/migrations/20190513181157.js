/**
 * Migration 20190513123826 copied user.abilities, user.vendorDetails.competenceLevels,
 * user.languageCombinations
 * to user.rates array. Rates entities need to be stored as: { _id, name }
 * except language combination { _id, name, isoCode })  hence this migration
*/
const _ = require('lodash');
const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    const usersDb = db.collection('users');
    const competenceLevelsDb = db.collection('competenceLevels');
    const languagesDb = db.collection('languages');
    const abilitiesDb = db.collection('abilities');
    let competenceLevels = [];
    let abilities = [];
    let languages = [];
    return competenceLevelsDb.find()
      .project({ name: 1 })
      .toArray()
      .then((competenceLevelsInDb) => {
        competenceLevels = competenceLevelsInDb;
      })
      .then(() =>
        abilitiesDb.find()
          .project({ name: 1 })
          .toArray()
          .then((abilitiesInDb) => {
            abilities = abilitiesInDb;
          }),
      )
      .then(() =>
        languagesDb.find()
          .project({ name: 1, isoCode: 1 })
          .toArray()
          .then((languagesInDb) => {
            languages = languagesInDb;
          }),
      )
      .then(() =>
        usersDb.find({
          $or: [{
            type: 'Vendor',
          },
          {
            type: 'Staff',
          }],
          rates: {
            $exists: true,
          },
        }).toArray()
          .then((users) => {
            users.forEach((user) => {
              if (_.get(user, 'rates.length', 0) > 0) {
                user.rates.forEach((rate) => {
                  if (rate.ability) {
                    rate.ability = abilities.find(abilityInDb =>
                      abilityInDb.name === rate.ability.name);
                  }
                  if (rate.competenceLevel) {
                    rate.competenceLevel = competenceLevels.find(c => c._id.toString() ===
                    rate.competenceLevel._id.toString());
                  }
                  if (rate.sourceLanguage) {
                    rate.sourceLanguage = languages.find(
                      languageInDb => languageInDb.name === rate.sourceLanguage.name);
                  }
                  if (rate.targetLanguage) {
                    rate.targetLanguage = languages.find(
                      languageInDb => languageInDb.name === rate.targetLanguage.name);
                  }
                });
              }
            });
            return users;
          })
          .then(users =>
            Promise.mapSeries(users, (u) => {
              if (u.rates.length > 0) {
                return usersDb.update({ _id: u._id },
                  {
                    $set: { rates: u.rates },
                  });
              }
            }),
          ),
      );
  });

if (require.main === module) {
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
