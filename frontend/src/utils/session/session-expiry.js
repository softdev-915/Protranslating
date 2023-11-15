
import _ from 'lodash';
import _obj from 'lodash/object';
import moment from 'moment';
import sessionObserver from '../observers/session';
import BrowserStorage from '../browser-storage';
import SessionFlags from './session-flags';

const EXPIRY = 'expiry';
const HEARTBEAT = 'heartbeat';
const eventsToTrack = ['mousemove', 'touchmove', 'keyup'];

export default class SessionExpiry {
  constructor(onSessionExpiry, heartbeatSendStrategy) {
    this._onSessionExpiry = onSessionExpiry;
    this._heartbeatSendStrategy = heartbeatSendStrategy;
    this.sendingHeartbeat = false;
    this.activityDetected = false;
    this.active = false;
    this.interval = null;
    this.app = null;
    this.userLogged = null;
    const flags = SessionFlags.getCurrentFlags();
    this.timeout = null;
    this.mock = _.get(flags, 'mock', false);
    this.refreshSessionInterval = null;
    sessionObserver.addObserver(this);
  }

  onLogin(user) {
    this.timeout = _.get(user, 'securityPolicy.timeoutInactivity');
    const flags = SessionFlags.getCurrentFlags();
    if (!_.isEmpty(flags.mockSessionTimeout) && !_.isNaN(Number(flags.mockSessionTimeout))) {
      this.timeout = Number(flags.mockSessionTimeout);
    }
    this.userLogged = user;
    this.browserStorage = new BrowserStorage(this.userLogged.sessionUUID, true);
    this.saveNextExpiry();
    this.start();
  }

  onLogout() {
    this.stop(false);
  }

  saveNextExpiry() {
    const expiry = this.nextExpiry();
    this.browserStorage.saveInCache(EXPIRY, expiry.format());
  }

  startRefreshSessionPoll() {
    let millisecondsInterval = (this.timeout * 60000) / 10;
    if (this.timeout < 1) {
      millisecondsInterval = 5000;
    }
    this.stopHeartbeat();
    this.refreshSessionInterval = setInterval(() => {
      this.heartbeat();
    }, millisecondsInterval);
  }

  stopRefreshSessionPoll() {
    clearInterval(this.refreshSessionInterval);
    this.active = false;
    this.start();
  }

  nextExpiry() {
    if (this.timeout) {
      const now = moment.utc();
      return now.add(this.timeout, 'minutes');
    }
    return null;
  }

  start() {
    if (!this.active) {
      this.startHeartbeat();
      this.startTrackingUserActivity();
      this.active = true;
    }
  }

  stop(sendExpiry) {
    if (_.isNil(this.userLogged)) return;
    this.active = false;
    this.stopHeartbeat();
    this.stopTrackingUserActivity();
    this.browserStorage.removeFromCache(EXPIRY);
    this.browserStorage.removeFromCache(HEARTBEAT);
    if (sendExpiry !== false) {
      let timeoutMessage;
      if (this.timeout < 1) {
        timeoutMessage = `${this.timeout * 60} seconds`;
      } else {
        timeoutMessage = `${this.timeout} minutes`;
      }
      this._onSessionExpiry(timeoutMessage);
    }
    this.timeout = null;
  }

  startTrackingUserActivity() {
    eventsToTrack.forEach((e) => {
      document.addEventListener(e, this._onActivity.bind(this));
    });
  }

  stopTrackingUserActivity() {
    eventsToTrack.forEach((e) => {
      document.removeEventListener(e, this._onActivity.bind(this));
    });
  }

  stopHeartbeat() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = null;
  }

  startHeartbeat() {
    let heartbeatInterval;
    if (this.timeout > 1) {
      heartbeatInterval = (this.timeout * 60000) / 10;
    } else {
      heartbeatInterval = 5000;
    }
    this.interval = setInterval(() => {
      const expiry = this.browserStorage.findInCache(EXPIRY);
      if (expiry) {
        const now = moment.utc();
        const diff = now.diff(moment.utc(expiry, 'YYYY-MM-DDTHH:mm:ssZ'), 'seconds');
        if (diff >= 0) {
          this.stop();
        } else if (this.activityDetected) {
          this.heartbeat();
        }
      } else {
        this.stop();
      }
    }, heartbeatInterval);
  }

  shouldTriggerHeartbeat() {
    const now = moment.utc();
    const lastHeartbeat = this.browserStorage.findInCache(HEARTBEAT);
    const lastHeartbeatTriggerInterval = this.timeout > 1 ? 30 : 5;
    if (this.sendingHeartbeat) {
      return false;
    }
    const isOldHeartbeat = now.diff(moment.utc(lastHeartbeat), 'seconds') >= lastHeartbeatTriggerInterval;
    return isOldHeartbeat || _.isNil(lastHeartbeat);
  }

  heartbeat() {
    const now = moment.utc();
    if (this.sendingHeartbeat) {
      return false;
    }
    if (!this.shouldTriggerHeartbeat()) {
      this.sendingHeartbeat = false;
      return false;
    }
    this.sendingHeartbeat = true;
    this._heartbeatSendStrategy()
      .then(() => {
        if (this.activityDetected) {
          this.browserStorage.saveInCache(HEARTBEAT, now.format());
        }
        this.activityDetected = false;
      })
      .catch((response) => {
        const statusCode = _obj.get(response, 'status.code');
        if (statusCode === 401) {
          this.stop();
        }
      })
      .finally(() => {
        this.sendingHeartbeat = false;
      });
  }

  _onActivity() {
    if (this.active) {
      this.activityDetected = true;
      this.saveNextExpiry();
    }
  }
}

