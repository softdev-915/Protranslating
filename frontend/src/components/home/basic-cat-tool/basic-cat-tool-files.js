import { fileSupported } from '../../../utils/basic-cat-tool';
import { getRequestDocuments } from '../list-request/request-inline-edit-helper';

export default {
  props: {
    request: {
      type: Object,
      required: true,
    },
  },
  computed: {
    requestFiles() {
      const requestDocuments = getRequestDocuments(this.request.languageCombinations);
      if (Array.isArray(requestDocuments)) {
        return requestDocuments.filter((d) => fileSupported(d.name));
      }
      return [];
    },
  },
};
