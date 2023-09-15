const striptags = require('striptags');
const SchemaAwareAPI = require('../../schema-aware-api');
const ConcurrencyReadDateChecker = require('../../../utils/concurrency');

class DocumentationAPI extends SchemaAwareAPI {
  getDocumentation(search) {
    const query = { lspId: this.lspId };
    let findOne = true;
    if (search.name) {
      query.name = search.name;
    } else {
      findOne = false;
      if (search.keywords) {
        query.$text = { $search: search.keywords, $caseSensitive: false };
      }
    }
    if (search.roles) {
      query.roles = { $in: search.roles };
    }
    if (findOne) {
      return this.schema.Documentation.findOne(query);
    }
    return this.schema.Documentation.find(query);
  }

  async update(documentation) {
    const query = { name: documentation.name, lspId: this.lspId };
    const unformattedHelp = striptags(documentation.help, [], ' ');
    const prospectDocumentation = {
      lspId: this.lspId,
      name: documentation.name,
      title: documentation.title,
      lang: documentation.lang,
      help: documentation.help,
      roles: documentation.roles[0],
      unformattedHelp,
    };
    let dbDocumentation = await this.schema.Documentation.findOne(query);
    if (dbDocumentation) {
      const concurrencyReadDateChecker = new ConcurrencyReadDateChecker(this.user, this.logger, {
        entityName: 'documentation',
      });
      await concurrencyReadDateChecker.failIfOldEntity(dbDocumentation);
      Object.assign(dbDocumentation, prospectDocumentation);
    } else {
      dbDocumentation = new this.schema.Documentation(prospectDocumentation);
    }
    await dbDocumentation.save();
    return dbDocumentation;
  }
}

module.exports = DocumentationAPI;
