import { store } from '../../stores/store';
import RedirectComponent from '../redirect-component/redirect-component.vue';
import UserService from '../../services/user-service';
import { hasRole } from '../../utils/user';

const VALID_TASK_READ_ROLES = ['TASK_READ_OWN', 'TASK_READ_ALL'];
const userService = new UserService();
const { userTypes } = userService;

export default {
  functional: true,
  render: function (createElement, context) {
    let component;
    const props = {};
    const userLogged = store.getters['app/userLogged'];
    const userCanReadTasks = VALID_TASK_READ_ROLES.some(r => hasRole(userLogged, r));
    const userCanAccessVendorDashboard = hasRole(userLogged, { oneOf: ['VENDOR-DASHBOARD_READ_OWN', 'VENDOR-DASHBOARD-FILTER_READ_OWN'] });
    const userCanAccessContactDashboard = hasRole(userLogged, { oneOf: ['CONTACT-DASHBOARD_READ_OWN', 'CONTACT-DASHBOARD-FILTER_READ_OWN'] });
    switch (userLogged.type) {
      case userTypes.staff:
      case userTypes.vendor:
        component = RedirectComponent;
        if (userCanAccessVendorDashboard) {
          props.componentName = 'vendor-dashboard';
        } else if (userCanReadTasks) {
          props.componentName = 'task-management';
        } else {
          props.componentName = 'list-user';
        }
        break;
      case userTypes.contact:
        component = RedirectComponent;
        if (userCanAccessContactDashboard) {
          props.componentName = 'contact-dashboard';
        } else {
          props.componentName = 'list-request';
        }
        break;
      default:
        component = RedirectComponent;
        props.componentName = 'list-request';
        break;
    }
    return createElement(
      component,
      Object.assign(context.data, { props }),
      context.children,
    );
  },
};
