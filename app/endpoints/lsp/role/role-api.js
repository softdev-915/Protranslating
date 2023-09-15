const SchemaAwareAPI = require('../../schema-aware-api');

class RoleAPI extends SchemaAwareAPI {
  async list() {
    const roles = await this.schema.Role.find({}).sort({ name: 1 });
    return roles;
  }
}

module.exports = RoleAPI;
