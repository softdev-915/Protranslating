const _ = require('lodash');
const { models: moongoseSchema } = require('../../../../components/database/mongo');
const apiResponse = require('../../../../components/api-response');

const { RestError } = apiResponse;

class GridAPI {
  constructor(logger) {
    this.logger = logger;
    this.schema = moongoseSchema;
  }

  async gridConfigByUser(user) {
    const userGrid = await this.schema.Grid.findByUser(user);

    return userGrid ? userGrid.grids : [];
  }

  async updateGridConfig(user, grid) {
    let userGrid = await this.schema.Grid.findByUser(user);

    if (!userGrid) {
      userGrid = new this.schema.Grid({
        lspId: user.lsp,
        userEmail: user.email,
        grids: [],
      });
      if (user._id) {
        userGrid.userId = user._id;
      }
    }
    const index = _.findIndex(userGrid.grids, (g) => g.grid === grid.grid);

    if (index >= 0) {
      userGrid.grids.set(index, grid);
    } else {
      userGrid.grids.push(grid);
    }
    await userGrid.save();

    return userGrid;
  }

  async deleteGridConfig(user, gridName) {
    const userGrid = await this.schema.Grid.findByUser(user);

    if (!userGrid) {
      throw new RestError(404, { message: 'Could not find grid' });
    }
    const index = _.findIndex(userGrid.grids, (g) => g.grid === gridName);

    if (index === -1) {
      throw new RestError(404, { message: 'Could not find grid' });
    }
    const deleted = userGrid.grids.splice(index, 1);

    await userGrid.save();

    return deleted;
  }
}

module.exports = GridAPI;
