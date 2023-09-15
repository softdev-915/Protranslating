// const _ = require('lodash');
// const { expect } = require('chai');
require('mocha');


describe('WorkflowEmailTriggerFactory', () => {
  it('should allow to change a task status if the following is not "Not Started" and user has WORKFLOW_UPDATE_ALL');
  it('should allow to change a task status if the following is not "Not Started" and user has WORKFLOW_UPDATE_OWN');
  it('should allow to change a task status if the following is not "Not Started" and user has TASK_UPDATE_ALL');
  it('should not allow to change a task status if the following is not "Not Started" and user has TASK_UPDATE_OWN');
  it('should allow to change a task status if the following is "Not Started" and user has TASK_UPDATE_OWN');
});
