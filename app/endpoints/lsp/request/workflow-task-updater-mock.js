const { compareFileArray } = require('../../../utils/document/document-helper');
const WorkflowTaskUpdater = require('./workflow-task-updater');

class WorkflowTaskUpdaterMock extends WorkflowTaskUpdater {
  _processProviderTaskFile(request, requestProviderTask, editableTask) {
    const comparison = compareFileArray(requestProviderTask.files, editableTask.files);

    comparison.missing.forEach((missing) => {
      requestProviderTask.files.pull({ _id: missing._id });
    });
    comparison.added.forEach((added) => {
      // Add task file if it doesn't exist already (whether is final or not)
      if (!requestProviderTask.files.find((f) => f._id.toString() === added._id)) {
        requestProviderTask.files.push(added);
      }
    });
  }
}

module.exports = WorkflowTaskUpdaterMock;
