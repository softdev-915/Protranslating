import _ from 'lodash';
import { capitalizeFirstLetter } from '../strings';

const addTTL = (notification, ttl) => {
  const newTTL = parseInt(ttl, 10);
  if (!Number.isNaN(newTTL)) {
    notification.ttl = newTTL;
  } else if (ttl === null) {
    delete notification.ttl;
  }
  return notification;
};

const successNotification = (message, ttl) => {
  const notification = {
    title: 'Success',
    message: message,
    state: 'success',
  };
  return addTTL(notification, ttl);
};

const errorNotification = (message, ttl, response = null, title = 'Error', details) => {
  const notification = {
    title,
    state: 'danger',
    message,
    response,
    details,
  };
  return addTTL(notification, ttl);
};

const warningNotification = (message, ttl, response = null, title = 'Error') => {
  const notification = {
    title,
    state: 'warning',
    message,
    response,
  };
  return addTTL(notification, ttl);
};

const infoNotification = (message, ttl, response = null, title = 'Info') => {
  const notification = {
    title,
    state: 'info',
    message,
    response,
  };
  return addTTL(notification, ttl);
};

const genericErrorNotification = (entityName, action, ttl) => {
  const firstCapitalized = capitalizeFirstLetter(entityName);
  const notification = { title: `${firstCapitalized} ${action} failed`,
    message: `There was an error ${action} the ${entityName}, please try again`,
    state: 'danger',
  };
  return addTTL(notification, ttl);
};
const creationFailedNotification = (entityName, ttl) => genericErrorNotification(entityName, 'creating', ttl);
const deleteFailedNotification = (entityName, ttl) => genericErrorNotification(entityName, 'deleting', ttl);
const retrieveFailedNotification = (entityName, ttl) => genericErrorNotification(entityName, 'retrieving', ttl);
const updateFailedNotification = (entityName, ttl) => genericErrorNotification(entityName, 'updating', ttl);
const iframeDownloadError = (err) => {
  const statusCode = _.get(err, 'status.code');
  const message = _.get(err, 'status.message', '');
  const notification = {
    title: 'Error',
    message: _.get(err, 'message', '') || 'Failed to download files',
    state: 'danger',
  };
  if (statusCode === 403 && message.indexOf('IP') >= 0) {
    notification.message = message;
  } else {
    notification.response = err;
  }
  return notification;
};

export {
  creationFailedNotification,
  deleteFailedNotification,
  retrieveFailedNotification,
  updateFailedNotification,
  iframeDownloadError,
  successNotification,
  errorNotification,
  warningNotification,
  infoNotification,
};
