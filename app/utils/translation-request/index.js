const _ = require('lodash');
const { RestError } = require('../../components/api-response');

class RequestTaskFiles {
  constructor(logger, requestAPI) {
    this.logger = logger;
    this.requestAPI = requestAPI;
  }

  retrieveRequestTaskFiles(user, request) {
    return this.requestAPI.findOne(request._id)
      .then((dbRequest) => {
        if (!dbRequest.workflows) {
          this.logger.info(`Task ${request.task} not found. No workflows`);
          throw new RestError(404, { message: `Task ${request.task} not found` });
        }
        let task;
        const wLen = dbRequest.workflows.length;
        for (let i = 0; i < wLen; i++) {
          const w = dbRequest.workflows[i];
          if (w.tasks) {
            task = w.tasks.find(t => t._id.toString() === request.task);
            if (task) {
              break;
            }
          }
        }
        // Check if tasks exists
        if (!task) {
          this.logger.info(`Task ${request.task} not found`);
          throw new RestError(404, { message: `Task ${request.task} not found` });
        }
        const providerTask = task.providerTasks
          .find(p => p._id.toString() === request.providerTask);
        // Check if provider task exists
        if (!providerTask || !providerTask.files) {
          this.logger.info(`Provider task ${request.providerTask} not found`);
          throw new RestError(404, { message: `Provider task ${request.providerTask} not found` });
        }
        return {
          company: _.get(dbRequest, 'company'),
          request: dbRequest,
          task: task,
        };
      });
  }
}

module.exports = RequestTaskFiles;
