/* eslint-disable max-len */
const { expect } = require('chai');
require('mocha');

const { completeRequests, transformRequestForProviderFactory } = require('../../../../../app/endpoints/lsp/task/task-api-helpers');
const { provider1Id, provider2Id, generateTestData } = require('./task-test-data');

describe('completeRequests', () => {
  it('should complete requests with provider 1', () => {
    const testData = generateTestData();
    const transformationResult = transformRequestForProviderFactory(provider1Id, testData.Request);
    const dbProviders = [testData.User.find(u => u._id.equals(provider1Id))];
    const { requests } = transformationResult;
    expect(requests).to.have.lengthOf(2);
    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.not.exist;
    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.not.exist;
    completeRequests(transformationResult, dbProviders);
    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);
    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);
  });

  it('should complete requests with provider 2', () => {
    const testData = generateTestData();
    const transformationResult = transformRequestForProviderFactory(provider2Id, testData.Request);
    const dbProviders = [testData.User.find(u => u._id.equals(provider2Id))];
    const { requests } = transformationResult;
    expect(requests).to.have.lengthOf(3);

    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.not.exist;

    expect(requests[0].workflows[0].tasks[0].providerTasks[1].provider).to.exist;
    expect(requests[0].workflows[0].tasks[0].providerTasks[1].provider.firstName).to.not.exist;

    expect(requests[0].workflows[1].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[1].tasks[0].providerTasks[0].provider.firstName).to.not.exist;

    expect(requests[0].workflows[1].tasks[1].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[1].tasks[1].providerTasks[0].provider.firstName).to.not.exist;

    expect(requests[0].workflows[2].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[2].tasks[0].providerTasks[0].provider.firstName).to.not.exist;

    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.not.exist;

    expect(requests[1].workflows[0].tasks[1].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[0].tasks[1].providerTasks[0].provider.firstName).to.not.exist;

    expect(requests[1].workflows[1].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[1].tasks[0].providerTasks[0].provider.firstName).to.not.exist;

    expect(requests[1].workflows[1].tasks[1].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[1].tasks[1].providerTasks[0].provider.firstName).to.not.exist;

    expect(requests[2].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[2].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.not.exist;

    completeRequests(transformationResult, dbProviders);

    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[0].workflows[0].tasks[0].providerTasks[1].provider).to.exist;
    expect(requests[0].workflows[0].tasks[0].providerTasks[1].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[0].workflows[1].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[1].tasks[0].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[0].workflows[1].tasks[1].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[1].tasks[1].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[0].workflows[2].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[0].workflows[2].tasks[0].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[1].workflows[0].tasks[1].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[0].tasks[1].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[1].workflows[1].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[1].tasks[0].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[1].workflows[1].tasks[1].providerTasks[0].provider).to.exist;
    expect(requests[1].workflows[1].tasks[1].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);

    expect(requests[2].workflows[0].tasks[0].providerTasks[0].provider).to.exist;
    expect(requests[2].workflows[0].tasks[0].providerTasks[0].provider.firstName)
      .to.eql(dbProviders[0].firstName);
  });

  it('should complete requests with no provider', () => {
    const testData = generateTestData();
    const transformationResult = transformRequestForProviderFactory(null, testData.Request);
    const dbProviders = testData.User.concat([]);
    const provider1Obj = testData.User.find(u => u._id.equals(provider1Id));
    const provider2Obj = testData.User.find(u => u._id.equals(provider2Id));
    const { requests } = transformationResult;
    expect(requests).to.have.lengthOf(4);

    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider.equals(provider1Id)).to.be.true;
    expect(requests[0].workflows[0].tasks[1].providerTasks[0].provider.equals(provider2Id)).to.be.true;
    expect(requests[0].workflows[0].tasks[1].providerTasks[1].provider.equals(provider2Id)).to.be.true;
    expect(requests[0].workflows[1].tasks[0].providerTasks[0].provider.equals(provider2Id)).to.be.true;
    expect(requests[0].workflows[1].tasks[1].providerTasks[0].provider.equals(provider2Id)).to.be.true;
    expect(requests[0].workflows[2].tasks[0].providerTasks[0].provider).to.not.exist;
    expect(requests[0].workflows[2].tasks[0].providerTasks[1].provider.equals(provider2Id)).to.be.true;
    expect(requests[0].workflows[2].tasks[1].providerTasks[0].provider).to.not.exist;
    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider.equals(provider2Id)).to.be.true;
    expect(requests[1].workflows[0].tasks[1].providerTasks[0].provider.equals(provider2Id)).to.be.true;
    expect(requests[1].workflows[1].tasks[0].providerTasks[0].provider.equals(provider2Id)).to.be.true;
    expect(requests[1].workflows[1].tasks[1].providerTasks[0].provider.equals(provider2Id)).to.be.true;
    expect(requests[1].workflows[2].tasks[0].providerTasks[0].provider).to.not.exist;
    expect(requests[1].workflows[2].tasks[1].providerTasks[0].provider).to.not.exist;
    expect(requests[2].workflows[0].tasks[0].providerTasks[0].provider.equals(provider1Id)).to.be.true;
    expect(requests[2].workflows[1].tasks[0].providerTasks[0].provider.equals(provider1Id)).to.be.true;
    expect(requests[2].workflows[2].tasks[0].providerTasks[0].provider.equals(provider1Id)).to.be.true;
    expect(requests[3].workflows[0].tasks[0].providerTasks[0].provider.equals(provider2Id)).to.be.true;

    completeRequests(transformationResult, dbProviders);

    expect(requests[0].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.eql(provider1Obj.firstName);
    expect(requests[0].workflows[0].tasks[1].providerTasks[0].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[0].workflows[0].tasks[1].providerTasks[1].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[0].workflows[1].tasks[0].providerTasks[0].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[0].workflows[1].tasks[1].providerTasks[0].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[0].workflows[2].tasks[0].providerTasks[0].provider).to.not.exist;
    expect(requests[0].workflows[2].tasks[0].providerTasks[1].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[0].workflows[2].tasks[1].providerTasks[0].provider).to.not.exist;
    expect(requests[1].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[1].workflows[0].tasks[1].providerTasks[0].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[1].workflows[1].tasks[0].providerTasks[0].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[1].workflows[1].tasks[1].providerTasks[0].provider.firstName).to.eql(provider2Obj.firstName);
    expect(requests[1].workflows[2].tasks[0].providerTasks[0].provider).to.not.exist;
    expect(requests[1].workflows[2].tasks[1].providerTasks[0].provider).to.not.exist;
    expect(requests[2].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.eql(provider1Obj.firstName);
    expect(requests[2].workflows[1].tasks[0].providerTasks[0].provider.firstName).to.eql(provider1Obj.firstName);
    expect(requests[2].workflows[2].tasks[0].providerTasks[0].provider.firstName).to.eql(provider1Obj.firstName);
    expect(requests[3].workflows[0].tasks[0].providerTasks[0].provider.firstName).to.eql(provider2Obj.firstName);
  });
});
