import _ from 'lodash';
import { isValidPassword, isEmail } from '../../../utils/form';

const CONTACT_USER_TYPE = 'Contact';
const STAFF_USER_TYPE = 'Staff';
const VENDOR_USER_TYPE = 'Vendor';
const _validatePassword = (user, errors) => {
  if (!user.password && user.isMandatoryPassword) {
    errors.push({ message: 'User must have a password', props: { password: { val: user.password } } });
  } else if (user.password && !isValidPassword(user.password, user.securityPolicy)) {
    errors.push({ message: 'User\'s password is invalid', props: { password: { val: user.password } } });
  }
  return errors;
};

const _emailPasswordValidation = (user, errors) => {
  if (!user.email) {
    errors.push({ message: 'User must have an email', props: { email: { val: user.email } } });
  }
  // IF editing a user, the password is NOT necessary if it previously had an email
  if (user._id && !user.oldEmail) {
    // IF editing a user with NO previous email, the password is mandatory.
    // (For example a former contact with no email that is edited into a staff or vendor user).
    _validatePassword(user, errors);
  } else if (!user._id) {
    // If user is new it MUST have a password
    _validatePassword(user, errors);
  }
};

const _validateContactPasswordIfNecessary = (user, errors) => {
  // IF creating or editing a user with no email, no password is necessary.
  // IF editing a user with email but we're not changing the email, no password is necessary.
  if (user.email) {
    if (user._id) {
      // IF user has an _id it means that the user is being edited.
      if (user.oldEmail && user.oldEmail !== user.email) {
        // IF old email exist and it is different from the current
        // email then we know the user's email is changing.
        // So in this case we're sure that the password must exist.
        _validatePassword(user, errors);
      }
    } else {
      // IF it is not an edition, then we're creating a user WITH email. so the password must exist.
      _validatePassword(user, errors);
    }
  }
};

const validateEmail = (user, errors) => {
  if (!_.isEmpty(user.email)) {
    if (!isEmail(user.email)) {
      errors.push({ message: 'User must have a valid email', props: { email: { val: user.email } } });
    }
  } else if (user.type === CONTACT_USER_TYPE) {
    errors.push({ message: 'User Contact must have a valid email', props: { email: { val: user.email } } });
  }
};

const _userBasicInfoValidation = (user, errors) => {
  if (!user.firstName) {
    errors.push({ message: 'User must have a first name', props: { firstName: { val: user.firstName } } });
  }
  if (!user.lastName) {
    errors.push({ message: 'User must have a last name', props: { lastName: { val: user.lastName } } });
  }
  validateEmail(user, errors);
};

const _validateContact = (user, errors) => {
  _validateContactPasswordIfNecessary(user, errors);
  if (_.isEmpty(_.get(user, 'company._id'))) {
    errors.push({ message: 'User type "Contact" must have a company', props: { company: { val: user.company } } });
  }
  if (!user.projectManagers || user.projectManagers.length === 0) {
    errors.push({ message: 'User type "Contact" must have at least one project manager', props: { projectManagers: { val: user.projectManagers } } });
  }
  if (user.contactDetails) {
    if (user.contactDetails.mainPhone && !user.contactDetails.mainPhone.number) {
      errors.push({
        message: 'User type "Contact" must have a valid main phone',
        props: { 'contactDetails.mainPhone.number': { val: user.contactDetails.mainPhone.number } },
      });
    }
    if (user.contactDetails.mainPhone && user.contactDetails.mainPhone.ext) {
      const extLength = user.contactDetails.mainPhone.ext.length;
      if (extLength > 4 || extLength < 3) {
        errors.push({
          message: 'Main phone number extension is invalid',
          props: { 'contactDetails.mainPhone.ext': { val: user.contactDetails.mainPhone.ext } },
        });
      }
    }
    if (user.contactDetails.billingEmail && !isEmail(user.contactDetails.billingEmail)) {
      errors.push({ message: 'User billingEmail is not a valid emal', props: { 'contactDetails.billingEmail': { val: user.contactDetails.billingEmail } } });
    }
  }
};

const _validateStaff = (user, errors) => {
  if (!user.email) {
    errors.push({ message: 'User must have an email', props: { email: { val: user.email } } });
  }
  _emailPasswordValidation(user, errors);
};

const _validateVendor = (user, errors) => {
  if (!user.email) {
    errors.push({ message: 'User must have an email', props: { email: { val: user.email } } });
  }
  _emailPasswordValidation(user, errors);
};

export const findUserValidationError = function (user) {
  const errors = [];
  _userBasicInfoValidation(user, errors);
  switch (user.type) {
    case CONTACT_USER_TYPE:
      _validateContact(user, errors);
      break;
    case STAFF_USER_TYPE:
      _validateStaff(user, errors);
      break;
    case VENDOR_USER_TYPE:
      _validateVendor(user, errors);
      break;
    default:
      errors.push({ message: 'User must have a type', props: { type: { val: user.type } } });
      break;
  }
  return errors;
};
