import _ from 'lodash';
import TmStoreMixin from '../../../mixins/tm-store-mixin';

export default {
  mixins: [TmStoreMixin],
  props: {
    canCreate: Boolean,
    canDelete: Boolean,
  },
  computed: {
    activeSegment() {
      if (this._activeSegmentsArray.length === 1) {
        return this.segmentById(_.first(this._activeSegmentsArray));
      }
      return null;
    },
  },
};
