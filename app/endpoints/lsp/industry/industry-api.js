const SchemaAwareAPI = require('../../schema-aware-api');

class IndustryApi extends SchemaAwareAPI {
  static getList() {
    return [
      'Automotive',
      'Communications',
      'Consumer Products',
      'Education',
      'Energy',
      'Entertainment',
      'Events',
      'Financial Services',
      'Food Services',
      'Healthcare',
      'Insurance',
      'Legal',
      'Life Sciences',
      'Manufacturing',
      'Market Research',
      'Marketing & PR',
      'Non-Profit',
      'Other',
      'Pharmaceutical',
      'Tech Services',
      'Transportation',
      'Travel',
      'Walk-Ins',
    ];
  }
}

module.exports = IndustryApi;
