import _ from 'lodash';
import TmStoreMixin from '../../../mixins/tm-store-mixin';

export default {
  mixins: [TmStoreMixin],
  computed: {
    tmName() {
      return _.get(this, 'tmInfo.name', '');
    },
  },
};
