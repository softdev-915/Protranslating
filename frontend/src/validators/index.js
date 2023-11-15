import { Validator } from 'vee-validate';
import PhoneExtValidator from './phone-ext-validator';
import CronValidator from './cron-validator';

// Import new validator and add it here
const validators = {
  'phone-ext-validator': PhoneExtValidator,
  'cron-validator': CronValidator,
};

export default () => {
  Object.keys(validators).forEach((name) => {
    Validator.extend(name, validators[name]);
  });
};
