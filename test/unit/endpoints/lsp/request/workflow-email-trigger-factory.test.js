const _ = require('lodash');
const { expect } = require('chai');
const { Types: { ObjectId } } = require('mongoose');
require('mocha');
const WorkflowEmailTriggerFactory = require('../../../../../app/endpoints/lsp/request/workflow-email-trigger-factory');

const buildCompleteWorkflow = () => ({
  status: 'In progress',
  workflows: [
    {
      _id: new ObjectId(),
      language: {
        name: 'French',
        isoCode: 'FRE',
        cultureCode: 'FRE',
      },
      tasks: [
        {
          _id: new ObjectId(),
          ability: 'Preflight',
          providerTasks: [{
            _id: new ObjectId(),
            provider: new ObjectId(),
            taskDueDate: new Date(),
            status: 'notStarted',
          }],
        },
        {
          _id: new ObjectId(),
          ability: 'Copy / Paste',
          providerTasks: [{
            _id: new ObjectId(),
            provider: new ObjectId(),
            taskDueDate: new Date(),
            status: 'notStarted',
          }],
        },
      ],
    },
    {
      _id: new ObjectId(),
      language: {
        name: 'Spanish',
        isoCode: 'SPA',
        cultureCode: 'SPA',
      },
      tasks: [
        {
          _id: new ObjectId(),
          ability: 'Coding',
          providerTasks: [{
            _id: new ObjectId(),
            provider: new ObjectId(),
            taskDueDate: new Date(),
            status: 'notStarted',
          }],
        },
        {
          _id: new ObjectId(),
          ability: 'Validation and Delivery',
          providerTasks: [{
            _id: new ObjectId(),
            provider: new ObjectId(),
            taskDueDate: new Date(),
            status: 'notStarted',
          }],
        },
      ],
    },
  ],
});

const cloneRequest = request => _.cloneDeep(request);

describe('WorkflowEmailTriggerFactory', () => {
  it('should trigger email when created and request status change', () => {
    const originalRequest = {
      status: 'To be processed',
      workflows: [],
    };
    const updatedRequest = buildCompleteWorkflow();
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(2);
    expect(emailTriggers[0]).to.eql({
      originalProviderTask: null,
      modifiedProviderTask: updatedRequest.workflows[0].tasks[0].providerTasks[0],
      workflow: updatedRequest.workflows[0],
      task: updatedRequest.workflows[0].tasks[0],
    });
    expect(emailTriggers[1]).to.eql({
      originalProviderTask: null,
      modifiedProviderTask: updatedRequest.workflows[1].tasks[0].providerTasks[0],
      workflow: updatedRequest.workflows[1],
      task: updatedRequest.workflows[1].tasks[0],
    });
  });

  it('should trigger email if when changing the previous task to completed', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.status = 'To be processed';
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'completed';
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(2);
    expect(emailTriggers[0]).to.eql({
      originalProviderTask: originalRequest.workflows[0].tasks[1].providerTasks[0],
      modifiedProviderTask: updatedRequest.workflows[0].tasks[1].providerTasks[0],
      workflow: updatedRequest.workflows[0],
      task: updatedRequest.workflows[0].tasks[1],
    });
    expect(emailTriggers[1]).to.eql({
      originalProviderTask: originalRequest.workflows[1].tasks[0].providerTasks[0],
      modifiedProviderTask: updatedRequest.workflows[1].tasks[0].providerTasks[0],
      workflow: updatedRequest.workflows[1],
      task: updatedRequest.workflows[1].tasks[0],
    });
  });

  it('should trigger email if the previous is deleted', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.status = 'To be processed';
    updatedRequest.workflows[0].tasks.splice(0, 1);
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(2);
    expect(emailTriggers[0]).to.eql({
      originalProviderTask: originalRequest.workflows[0].tasks[1].providerTasks[0],
      modifiedProviderTask: updatedRequest.workflows[0].tasks[0].providerTasks[0],
      workflow: updatedRequest.workflows[0],
      task: updatedRequest.workflows[0].tasks[0],
    });
  });

  it('should not trigger email if nothing changed', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(0);
  });

  it('should not trigger email if change does not complete a provider', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.workflows[1].tasks[0].providerTasks[0].status = 'inProgress';
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'inProgress';
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(0);
  });

  it('should not trigger email if change rolls back provider task status to not started', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.workflows[0].tasks[0].providerTasks[0].status = 'inProgress';
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'notStarted';
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(0);
  });

  it('should not trigger if request status is not "approved"', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.status = 'To be processed';
    updatedRequest.status = 'To be processed';
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'completed';
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(0);
  });

  it('should trigger to all provider tasks', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.status = 'To be processed';
    originalRequest.workflows.splice(1, 1);
    updatedRequest.workflows.splice(1, 1);
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'completed';
    updatedRequest.workflows[0].tasks[1].providerTasks.push({
      _id: new ObjectId(),
      provider: new ObjectId(),
      taskDueDate: new Date(),
      status: 'notStarted',
    });
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(2);
  });

  it('should not trigger emails if task status\' isn\'t not started', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.status = 'To be processed';
    originalRequest.workflows.splice(1, 1);
    updatedRequest.workflows.splice(1, 1);
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'completed';
    updatedRequest.workflows[0].tasks[1].providerTasks[0].status = 'inProgress';
    updatedRequest.workflows[0].tasks[1].providerTasks.push({
      _id: new ObjectId(),
      provider: new ObjectId(),
      taskDueDate: new Date(),
      status: 'inProgress',
    });
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(0);
  });

  it('should not trigger emails if previous task\'s provider task are not all completed', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.workflows.splice(1, 1);
    updatedRequest.workflows.splice(1, 1);
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'notStarted';
    const task2 = () => ({
      _id: new ObjectId(),
      provider: new ObjectId(),
      taskDueDate: new Date(),
      status: 'completed',
    });
    originalRequest.workflows[0].tasks[0].providerTasks.push(task2());
    originalRequest.workflows[0].tasks[0].providerTasks[1].status = 'notStarted';
    updatedRequest.workflows[0].tasks[0].providerTasks.push(task2());
    updatedRequest.workflows[0].tasks[0].providerTasks[1].status = 'completed';
    originalRequest.workflows[0].tasks[1].providerTasks[0].status = 'notStarted';
    updatedRequest.workflows[0].tasks[1].providerTasks[0].status = 'notStarted';
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(0);
  });

  it('should trigger emails if previous task\'s provider task are all completed', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.workflows.splice(1, 1);
    updatedRequest.workflows.splice(1, 1);
    originalRequest.workflows[0].tasks[0].providerTasks[0].status = 'completed';
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'completed';
    const task2 = () => ({
      _id: new ObjectId(),
      provider: new ObjectId(),
      taskDueDate: new Date(),
      status: 'completed',
    });
    originalRequest.workflows[0].tasks[0].providerTasks.push(task2());
    originalRequest.workflows[0].tasks[0].providerTasks[1].status = 'notStarted';
    updatedRequest.workflows[0].tasks[0].providerTasks.push(task2());
    updatedRequest.workflows[0].tasks[0].providerTasks[1].status = 'completed';
    originalRequest.workflows[0].tasks[1].providerTasks[0].status = 'notStarted';
    updatedRequest.workflows[0].tasks[1].providerTasks[0].status = 'notStarted';
    updatedRequest.workflows[0].tasks[1].providerTasks.push(task2());
    updatedRequest.workflows[0].tasks[1].providerTasks[1].status = 'notStarted';
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(2);
  });

  it('should not trigger email when providers are working in parallel and a provider completes the task', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.workflows.splice(1, 1);
    updatedRequest.workflows.splice(1, 1);
    originalRequest.workflows[0].tasks.splice(1, 1);
    updatedRequest.workflows[0].tasks.splice(1, 1);
    originalRequest.workflows[0].tasks[0].providerTasks[0].status = 'inProgress';
    updatedRequest.workflows[0].tasks[0].providerTasks[0].status = 'completed';
    const task2 = () => ({
      _id: new ObjectId(),
      provider: new ObjectId(),
      taskDueDate: new Date(),
      status: 'notStarted',
    });
    originalRequest.workflows[0].tasks[0].providerTasks.push(task2());
    updatedRequest.workflows[0].tasks[0].providerTasks.push(task2());
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(1);
  });

  it('should trigger email when providers changes', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.status = 'To be processed';
    originalRequest.workflows.splice(1, 1);
    updatedRequest.workflows.splice(1, 1);
    originalRequest.workflows[0].tasks[0].providerTasks.forEach((pt) => { pt.status = 'completed'; });
    updatedRequest.workflows[0].tasks[0].providerTasks.forEach((pt) => { pt.status = 'completed'; });
    // provider change
    updatedRequest.workflows[0].tasks[1].providerTasks[0].provider = new ObjectId();
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(1);
  });

  it('should not trigger email when providers changes but status isn\'t "notStarted" ', () => {
    const originalRequest = buildCompleteWorkflow();
    const updatedRequest = cloneRequest(originalRequest);
    originalRequest.status = 'To be processed';
    originalRequest.workflows.splice(1, 1);
    updatedRequest.workflows.splice(1, 1);
    originalRequest.workflows[0].tasks[0].providerTasks.forEach((pt) => { pt.status = 'completed'; });
    updatedRequest.workflows[0].tasks[0].providerTasks.forEach((pt) => { pt.status = 'completed'; });
    // provider change
    originalRequest.workflows[0].tasks[1].providerTasks[0].status = 'inProgress';
    updatedRequest.workflows[0].tasks[1].providerTasks[0].status = 'inProgress';
    updatedRequest.workflows[0].tasks[1].providerTasks[0].provider = new ObjectId();
    const triggerFactory = new WorkflowEmailTriggerFactory(originalRequest);
    const emailTriggers = triggerFactory.findEmailsToSend(updatedRequest);
    expect(emailTriggers).to.exist;
    expect(emailTriggers.length).to.eql(0);
  });
});
