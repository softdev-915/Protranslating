const chai = require('chai');
require('mocha');

const rolesUtils = require('../../../../app/utils/roles');

const expect = chai.expect;


const user = {
  _id: 'userId',
  email: 'test@protranslating.com',
  firstName: 'Test',
  lastName: 'Guy',
  lsp: 'testLspId',
  roles: ['USER_UPDATE_ALL', 'USER_CREATE_ALL', 'CUSTOMER_CREATE_OWN'],
  groups: [{
    name: 'sample group',
    roles: ['CUSTOMER_READ_ALL'],
  }],
  type: 'Staff',
};

describe('Roles utils', () => {
  it('should return true if the user has the proper role', () => {
    expect(rolesUtils.checkEndpointSecurity(['USER_UPDATE_ALL'], user)).to.be.true;
    expect(rolesUtils.checkEndpointSecurity(['USER_CREATE_ALL'], user)).to.be.true;
    expect(rolesUtils.checkEndpointSecurity(['CUSTOMER_CREATE_OWN'], user)).to.be.true;
    expect(rolesUtils.checkEndpointSecurity(['USER_UPDATE_ALL', 'CUSTOMER_CREATE_OWN'], user)).to.be.true;
    expect(rolesUtils.checkEndpointSecurity(['USER_UPDATE_ALL', 'USER_CREATE_ALL', 'CUSTOMER_CREATE_OWN'], user)).to.be.true;
  });

  it('should return true if the user has the proper role even in groups', () => {
    expect(rolesUtils.checkEndpointSecurity(['CUSTOMER_READ_ALL'], user)).to.be.true;
    expect(rolesUtils.checkEndpointSecurity(['USER_UPDATE_ALL', 'CUSTOMER_READ_ALL'], user)).to.be.true;
  });

  it('should return false if the user has not the proper role', () => {
    expect(rolesUtils.checkEndpointSecurity(['INEXISTING_CREATE_ALL'], user)).to.be.false;
    expect(rolesUtils.checkEndpointSecurity(['CUSTOMER_READ_ALL', 'INEXISTING_CREATE_ALL'], user)).to.be.false;
  });

  it('should return true if the user has at least one role using oneOf', () => {
    expect(rolesUtils.checkEndpointSecurity([{ oneOf: ['INEXISTING_CREATE_ALL', 'CUSTOMER_READ_ALL'] }], user)).to.be.true;
  });

  it('should return false if the user has at least one role using oneOf but other condition fails', () => {
    expect(rolesUtils.checkEndpointSecurity(['INEXISTING_READ_ALL', { oneOf: ['INEXISTING_CREATE_ALL', 'CUSTOMER_READ_ALL'] }], user)).to.be.false;
    expect(rolesUtils.checkEndpointSecurity([{ oneOf: ['INEXISTING_CREATE_ALL', 'CUSTOMER_READ_ALL'] }, 'INEXISTING_READ_ALL'], user)).to.be.false;
  });

  it('should return false if a function returns something falsy', () => {
    expect(rolesUtils.checkEndpointSecurity([() => false], user)).to.be.false;
    expect(rolesUtils.checkEndpointSecurity([u => u.lsp === 'otherTestLspId'], user)).to.be.false;
  });

  it('should return true if a function returns something truthy', () => {
    expect(rolesUtils.checkEndpointSecurity([() => true], user)).to.be.true;
    expect(rolesUtils.checkEndpointSecurity([u => u.lsp === 'testLspId'], user)).to.be.true;
  });
});
