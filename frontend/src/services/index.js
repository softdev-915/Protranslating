import AuthService from './auth-service';
import CompanyService from './company-service';
import DocumentationService from './documentation-service';
import GroupService from './group-service';
import RoleService from './role-service';
import UserService from './user-service';
import LspService from './lsp-service';
import LogService from './log-service';

const servicesClasses = {
  AuthService,
  DocumentationService,
  CompanyService,
  GroupService,
  RoleService,
  UserService,
  LspService,
  LogService,
};

/**
 * ServiceFactory implements lazy creation of services.
 * Since VueResource might not be injected upon a service require, this class
 * ensures that a service is build upon first usage, and not in require time.
 */
class ServiceFactory {
  constructor(services = {}, classes = servicesClasses) {
    this.services = services;
    this.servicesClasses = classes;
  }

  /**
   * @returns {AuthService}
   */
  authService() {
    return this._ensureService('AuthService');
  }

  /**
   * @returns {CompanyService}
   */
  companyService() {
    return this._ensureService('CompanyService');
  }

  /**
   * @returns {LspService}
   */
  lspService() {
    return this._ensureService('LspService');
  }

  /**
   * @returns {DocumentationService}
   */
  documentationService() {
    return this._ensureService('DocumentationService');
  }

  /**
   * @returns {GroupService}
   */
  groupService() {
    return this._ensureService('GroupService');
  }

  /**
   * @returns {RoleService}
   */
  roleService() {
    return this._ensureService('RoleService');
  }

  /**
   * @returns {UserService}
   */
  userService() {
    return this._ensureService('UserService');
  }

  /**
   * @returns {LogService}
   */
  logService() {
    return this._ensureService('LogService');
  }

  _ensureService(serviceName) {
    if (this.services[serviceName]) {
      // returns singleton instance
      return this.services[serviceName];
    }
    if (!this.servicesClasses[serviceName]) {
      throw new Error(`Could not find service ${serviceName}`);
    }
    const ServiceClass = this.servicesClasses[serviceName];
    const newServiceInstance = new ServiceClass();
    this.services[serviceName] = newServiceInstance;
    return newServiceInstance;
  }
}

const serviceFactory = new ServiceFactory();

export default serviceFactory;
