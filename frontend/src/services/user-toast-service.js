import userToastResource from '../resources/user-toast';
import resourceWrapper from './resource-wrapper';

export default class UserToastService {
  constructor(resource = userToastResource) {
    this.resource = resource;
  }

  retrieve(params) {
    return resourceWrapper(this.resource.query(params), false);
  }

  edit({ userId, toastId, data }) {
    return resourceWrapper(this.resource.update({ userId, toastId }, data));
  }
}
