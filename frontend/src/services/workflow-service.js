import Vue from 'vue';
import resourceWrapper from './resource-wrapper';
import workflowResource from '../resources/workflow';
import lspAwareUrl from '../resources/lsp-aware-url';

export default class WorkflowService {
  constructor(resource = workflowResource) {
    this.resource = resource;
  }

  edit(requestId, workflowId, editBody, { withCATData }) {
    return resourceWrapper(
      this.resource.update({ requestId, workflowId, withCATData }, editBody)
    );
  }

  create(requestId, createBody, { withCATData }) {
    return resourceWrapper(this.resource.save({ requestId, withCATData }, createBody));
  }

  delete(requestId, deleteBody, { withCATData }) {
    return resourceWrapper(
      this.resource.delete({ requestId, withCATData }, deleteBody)
    );
  }

  setOrder(requestId, orderBody, { withCATData }) {
    const endpointUrl = lspAwareUrl(`request/${requestId}/set-workflow-order`);
    return resourceWrapper(
      Vue.http.put(endpointUrl, orderBody, { params: { withCATData } })
    );
  }

  paste(requestId, pasteBody, { withCATData }) {
    const endpointUrl = lspAwareUrl(`request/${requestId}/workflow-paste`);
    return resourceWrapper(
      Vue.http.put(endpointUrl, pasteBody, { params: { withCATData } })
    );
  }

  list(requestId, { workflowIds }, { withCATData }) {
    return resourceWrapper(
      this.resource.get({ requestId, workflowIds, withCATData })
    );
  }
}
