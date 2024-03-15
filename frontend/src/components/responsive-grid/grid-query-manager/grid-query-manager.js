import { isEqual } from 'lodash';
import { parseQuery } from '../../../utils/grid';

export default {
  created: function () {
    if (this.useUrl) {
      this.query = parseQuery(this.$route.query);
    }
  },
  props: {
    value: {
      type: Object,
    },
    externalQuery: {
      type: Object,
    },
  },
  data() {
    return {
      query: {},
    };
  },
  watch: {
    value: function (newValue) {
      if (this.useUrl && !isEqual(newValue, this.$route.query)) {
        this.$router.push({ query: newValue }).catch((err) => { console.log(err); });
      }
    },
    query: function (newQuery) {
      this.$emit('input', newQuery);
    },
  },
  computed: {
    useUrl: function () {
      if (this.externalQuery) {
        return false;
      }
      return true;
    },
  },
};
