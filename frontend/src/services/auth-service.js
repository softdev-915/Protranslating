import authResource from '../resources/auth';
import resourceWrapper from './resource-wrapper';

export default class AuthService {
  constructor(resource = authResource) {
    if (typeof resource === 'function') {
      this.resource = resource();
    } else {
      this.resource = resource;
    }
  }

  login(credentials) {
    return resourceWrapper(this.resource.save(credentials));
  }

  verifyHotp(credentials) {
    return resourceWrapper(this.resource.save({ id: 'hotp' }, { hotp: credentials.hotp }));
  }

  getCurrentUser() {
    return resourceWrapper(this.resource.get({ id: 'me' }));
  }

  logout() {
    return resourceWrapper(this.resource.delete());
  }

  sendForgotPassword(data) {
    return resourceWrapper(this.resource.save({ id: 'forgot-password' }, data));
  }

  sendNewPassword(data) {
    const dataClone = { ...data };
    delete dataClone.code;
    return resourceWrapper(this.resource.update({ id: 'forgot-password', code: data.code }, dataClone));
  }

  sendHeartbeat() {
    return resourceWrapper(this.resource.save({ id: 'heartbeat' }, { data: null }), false);
  }
}
