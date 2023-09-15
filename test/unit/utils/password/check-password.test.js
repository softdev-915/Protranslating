const chai = require('chai');
require('mocha');
const passwordUtils = require('../../../../app/utils/password');
const expect = chai.expect;

describe('Password utils', () => {
  it('should return false if the password doesn\'t contain at least a lowercase letter', () => {
    const newPassword = 'PASSWORD1+*';
    expect(passwordUtils.isValidPassword(newPassword)).to.be.false;
  });

  it('should return false if the password doesn\'t contain at least an uppercase letter', () => {
    const newPassword = 'password1+*';
    expect(passwordUtils.isValidPassword(newPassword)).to.be.false;
  });

  it('should return false if the password doesn\'t contain at least a number', () => {
    const newPassword = 'Password++*';
    expect(passwordUtils.isValidPassword(newPassword)).to.be.false;
  });

  it('should return false if password doesn\'t contain at least a special character', () => {
    const newPassword = 'Password123';
    expect(passwordUtils.isValidPassword(newPassword)).to.be.false;
  });

  it('should return false if password isn\'t at least 10 characters long', () => {
    const newPassword = 'Pass1+*';
    expect(passwordUtils.isValidPassword(newPassword)).to.be.false;
  });

  it('should return true if password contains lowercase and uppercase letters, numbers, symbols and is longer than 10 characters', () => {
    const newPassword = 'Password123*';
    expect(passwordUtils.isValidPassword(newPassword)).to.be.true;
  });
});
