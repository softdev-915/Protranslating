
import _ from 'lodash';
import FilesMixin from '../../../mixins/files-mixin';

export default {
  name: 'custom-query-grid-last-result',
  mixins: [FilesMixin],
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  computed: {
    hasLastResult() {
      return !_.isNil(this.item.myLastRunAt);
    },
  },
  created() {
    this.notAllowedEntities = _.get(this, 'item.notAllowedEntities', []);
    this.lastResultDoc = {
      _id: this.item._id,
      url: `/get-file?noIframe=true&url=/api/lsp/${this.item.lspId}/custom-query/${this.item._id}/last-result`,
    };
  },
};
