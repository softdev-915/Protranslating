import _ from 'lodash';
import cronParser from 'cron-parser';

export default {
  getMessage: () => 'Field contains invalid cron expression',
  validate: (value) => _.isEmpty(_.get(cronParser.parseString(value), 'errors', {})),
};
