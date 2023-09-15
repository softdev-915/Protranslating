const Promise = require('bluebird');
const mongo = require('../components/database/mongo');
const configuration = require('../components/configuration');
const _ = require('lodash');

const migration = () => mongo.connect(configuration)
  .then(connections => connections.mongoose.connection)
  .then((db) => {
    // write your migration logic here.
    const grids = db.collection('grids');
    const users = db.collection('users');
    const collections = {
      grids,
      users,
    };
    return collections.users.find({}).toArray()
      .then((dbUsers) => {
        const promises = [];
        dbUsers.forEach((user) => {
          if (user.accounts) {
            user.accounts.forEach((account, index) => {
              if (typeof account.customer !== 'undefined') {
                user.accounts[index].company = account.customer;
                delete user.accounts[index].customer;
              }
            });

            // update the user
            promises.push(() => collections.users.update({ _id: user._id }, { $set: user }));
          }
        });
        // Update users account roles
        return Promise.resolve(promises).mapSeries(f => f());
      })
      .then(() => collections.grids.find().toArray())
      .then((dbGrids) => {
        const promises = [];
        dbGrids.forEach((grid) => {
          if (grid.grids && grid.grids.length && grid.grids.length > 0) {
            grid.grids.forEach((gridGeneralConf, index) => {
              gridGeneralConf.configs.forEach((gridConfig, indexGridConfig) => {
                gridConfig.columns.forEach((configColumn, indexConfigColumn) => {
                  // Override configColumn name and prop
                  if (typeof configColumn.name === 'string'
                    && configColumn.name.match(/Customer/i)) {
                    grid.grids[index].configs[indexGridConfig].columns[indexConfigColumn].name =
                      configColumn.name.replace(/Customer/, 'Company');
                    grid.grids[index].configs[indexGridConfig].columns[indexConfigColumn].prop =
                      configColumn.prop.replace(/customer/, 'company');
                  }
                });

                // Remove duplications
                grid.grids[index].configs[indexGridConfig].columns =
                  _.uniqBy(grid.grids[index].configs[indexGridConfig].columns, 'name');
              });
            });

            // update the grid
            promises.push(() => collections.grids.update({ _id: grid._id }, { $set: grid }));
          }
        });
        // Change saved grid settings
        return Promise.resolve(promises).mapSeries(f => f());
      });
  });

if (require.main === module) {
  // Update grids
  // Update accounts
  migration().then(() => process.exit(0)).catch((err) => { throw err; });
} else {
  module.exports = migration;
}
