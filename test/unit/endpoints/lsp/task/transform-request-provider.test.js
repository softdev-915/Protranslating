const { expect } = require('chai');
require('mocha');

const { transformRequestForProviderFactory } = require('../../../../../app/endpoints/lsp/task/task-api-helpers');
const { provider1Id, provider2Id, generateTestData } = require('./task-test-data');

describe('transformRequestForProviderFactory', () => {
  it('should filter workflows for provider1', () => {
    const testData = generateTestData();
    const { allProviders, requests } =
      transformRequestForProviderFactory(provider1Id, testData.Request);
    expect(allProviders).to.exist;
    const providerKeys = Object.keys(allProviders);
    expect(providerKeys.length).to.eql(1);
    expect(providerKeys[0]).to.eql(provider1Id.toString());
    const providerLocation = allProviders[providerKeys[0]];
    expect(providerLocation.length).to.eql(4);

    expect(providerLocation[0].requestIndex).to.eql(0);
    expect(providerLocation[0].workflowIndex).to.eql(0);
    expect(providerLocation[0].taskIndex).to.eql(0);
    expect(providerLocation[0].providerTaskIndex).to.eql(0);

    expect(providerLocation[1].requestIndex).to.eql(1);
    expect(providerLocation[1].workflowIndex).to.eql(0);
    expect(providerLocation[1].taskIndex).to.eql(0);
    expect(providerLocation[1].providerTaskIndex).to.eql(0);

    expect(providerLocation[2].requestIndex).to.eql(1);
    expect(providerLocation[2].workflowIndex).to.eql(1);
    expect(providerLocation[2].taskIndex).to.eql(0);
    expect(providerLocation[2].providerTaskIndex).to.eql(0);

    expect(providerLocation[3].requestIndex).to.eql(1);
    expect(providerLocation[3].workflowIndex).to.eql(2);
    expect(providerLocation[3].taskIndex).to.eql(0);
    expect(providerLocation[3].providerTaskIndex).to.eql(0);

    expect(requests).to.have.lengthOf(2);
  });

  it('should filter workflows for provider2Id', () => {
    const testData = generateTestData();
    const { allProviders, requests } =
      transformRequestForProviderFactory(provider2Id, testData.Request);
    expect(allProviders).to.exist;
    const providerKeys = Object.keys(allProviders);
    expect(providerKeys.length).to.eql(1);
    expect(providerKeys[0]).to.eql(provider2Id.toString());
    const providerLocation = allProviders[providerKeys[0]];
    expect(providerLocation.length).to.eql(10);

    expect(providerLocation[0].requestIndex).to.eql(0);
    expect(providerLocation[0].workflowIndex).to.eql(0);
    expect(providerLocation[0].taskIndex).to.eql(0);
    expect(providerLocation[0].providerTaskIndex).to.eql(0);

    expect(providerLocation[1].requestIndex).to.eql(0);
    expect(providerLocation[1].workflowIndex).to.eql(0);
    expect(providerLocation[1].taskIndex).to.eql(0);
    expect(providerLocation[1].providerTaskIndex).to.eql(1);

    expect(providerLocation[2].requestIndex).to.eql(0);
    expect(providerLocation[2].workflowIndex).to.eql(1);
    expect(providerLocation[2].taskIndex).to.eql(0);
    expect(providerLocation[2].providerTaskIndex).to.eql(0);

    expect(providerLocation[3].requestIndex).to.eql(0);
    expect(providerLocation[3].workflowIndex).to.eql(1);
    expect(providerLocation[3].taskIndex).to.eql(1);
    expect(providerLocation[3].providerTaskIndex).to.eql(0);

    expect(providerLocation[4].requestIndex).to.eql(0);
    expect(providerLocation[4].workflowIndex).to.eql(2);
    expect(providerLocation[4].taskIndex).to.eql(0);
    expect(providerLocation[4].providerTaskIndex).to.eql(0);

    expect(providerLocation[5].requestIndex).to.eql(1);
    expect(providerLocation[5].workflowIndex).to.eql(0);
    expect(providerLocation[5].taskIndex).to.eql(0);
    expect(providerLocation[5].providerTaskIndex).to.eql(0);

    expect(providerLocation[6].requestIndex).to.eql(1);
    expect(providerLocation[6].workflowIndex).to.eql(0);
    expect(providerLocation[6].taskIndex).to.eql(1);
    expect(providerLocation[6].providerTaskIndex).to.eql(0);

    expect(providerLocation[7].requestIndex).to.eql(1);
    expect(providerLocation[7].workflowIndex).to.eql(1);
    expect(providerLocation[7].taskIndex).to.eql(0);
    expect(providerLocation[7].providerTaskIndex).to.eql(0);

    expect(providerLocation[8].requestIndex).to.eql(1);
    expect(providerLocation[8].workflowIndex).to.eql(1);
    expect(providerLocation[8].taskIndex).to.eql(1);
    expect(providerLocation[8].providerTaskIndex).to.eql(0);

    expect(providerLocation[9].requestIndex).to.eql(2);
    expect(providerLocation[9].workflowIndex).to.eql(0);
    expect(providerLocation[9].taskIndex).to.eql(0);
    expect(providerLocation[9].providerTaskIndex).to.eql(0);

    expect(requests).to.have.lengthOf(3);
  });

  it('should filter workflows for no provider', () => {
    const testData = generateTestData();
    const { allProviders, requests } =
      transformRequestForProviderFactory(null, testData.Request);
    expect(allProviders).to.exist;
    const providerKeys = Object.keys(allProviders);
    expect(providerKeys.length).to.eql(2);
    const provider1Index = providerKeys.findIndex(pk => pk === provider1Id.toString());
    const provider2Index = providerKeys.findIndex(pk => pk === provider2Id.toString());

    expect(provider1Index).to.not.eq(-1);
    expect(provider2Index).to.not.eq(-1);

    const provider1Location = allProviders[providerKeys[provider1Index]];

    expect(provider1Location.length).to.eql(4);

    expect(provider1Location[0].requestIndex).to.eql(0);
    expect(provider1Location[0].workflowIndex).to.eql(0);
    expect(provider1Location[0].taskIndex).to.eql(0);
    expect(provider1Location[0].providerTaskIndex).to.eql(0);

    expect(provider1Location[1].requestIndex).to.eql(2);
    expect(provider1Location[1].workflowIndex).to.eql(0);
    expect(provider1Location[1].taskIndex).to.eql(0);
    expect(provider1Location[1].providerTaskIndex).to.eql(0);

    expect(provider1Location[2].requestIndex).to.eql(2);
    expect(provider1Location[2].workflowIndex).to.eql(1);
    expect(provider1Location[2].taskIndex).to.eql(0);
    expect(provider1Location[2].providerTaskIndex).to.eql(0);

    expect(provider1Location[3].requestIndex).to.eql(2);
    expect(provider1Location[3].workflowIndex).to.eql(2);
    expect(provider1Location[3].taskIndex).to.eql(0);
    expect(provider1Location[3].providerTaskIndex).to.eql(0);

    const provider2Location = allProviders[providerKeys[provider2Index]];
    expect(provider2Location.length).to.eql(10);

    expect(provider2Location[0].requestIndex).to.eql(0);
    expect(provider2Location[0].workflowIndex).to.eql(0);
    expect(provider2Location[0].taskIndex).to.eql(1);
    expect(provider2Location[0].providerTaskIndex).to.eql(0);

    expect(provider2Location[1].requestIndex).to.eql(0);
    expect(provider2Location[1].workflowIndex).to.eql(0);
    expect(provider2Location[1].taskIndex).to.eql(1);
    expect(provider2Location[1].providerTaskIndex).to.eql(1);

    expect(provider2Location[2].requestIndex).to.eql(0);
    expect(provider2Location[2].workflowIndex).to.eql(1);
    expect(provider2Location[2].taskIndex).to.eql(0);
    expect(provider2Location[2].providerTaskIndex).to.eql(0);

    expect(provider2Location[3].requestIndex).to.eql(0);
    expect(provider2Location[3].workflowIndex).to.eql(1);
    expect(provider2Location[3].taskIndex).to.eql(1);
    expect(provider2Location[3].providerTaskIndex).to.eql(0);

    expect(provider2Location[4].requestIndex).to.eql(0);
    expect(provider2Location[4].workflowIndex).to.eql(2);
    expect(provider2Location[4].taskIndex).to.eql(0);
    expect(provider2Location[4].providerTaskIndex).to.eql(1);

    expect(provider2Location[5].requestIndex).to.eql(1);
    expect(provider2Location[5].workflowIndex).to.eql(0);
    expect(provider2Location[5].taskIndex).to.eql(0);
    expect(provider2Location[5].providerTaskIndex).to.eql(0);

    expect(provider2Location[6].requestIndex).to.eql(1);
    expect(provider2Location[6].workflowIndex).to.eql(0);
    expect(provider2Location[6].taskIndex).to.eql(1);
    expect(provider2Location[6].providerTaskIndex).to.eql(0);

    expect(provider2Location[7].requestIndex).to.eql(1);
    expect(provider2Location[7].workflowIndex).to.eql(1);
    expect(provider2Location[7].taskIndex).to.eql(0);
    expect(provider2Location[7].providerTaskIndex).to.eql(0);

    expect(provider2Location[8].requestIndex).to.eql(1);
    expect(provider2Location[8].workflowIndex).to.eql(1);
    expect(provider2Location[8].taskIndex).to.eql(1);
    expect(provider2Location[8].providerTaskIndex).to.eql(0);

    expect(provider2Location[9].requestIndex).to.eql(3);
    expect(provider2Location[9].workflowIndex).to.eql(0);
    expect(provider2Location[9].taskIndex).to.eql(0);
    expect(provider2Location[9].providerTaskIndex).to.eql(0);

    expect(requests).to.have.lengthOf(4);
  });
});
