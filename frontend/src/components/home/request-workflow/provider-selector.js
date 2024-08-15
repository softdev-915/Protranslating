import _ from 'lodash';
import UserAjaxBasicSelect from '../../form/user-ajax-basic-select.vue';
import UserService from '../../../services/user-service';

const CUSTOM_PROPS = ['ref', 'sort', 'retrieve', 'custom-attr', 'customAttr'];
const CUSTOM_LISTENERS = [];
const service = new UserService();

export default {
  props: {
    ...UserAjaxBasicSelect.props,
  },
  components: {
    UserAjaxBasicSelect,
  },
  computed: {
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    retrieveProviders() {
      return service.retrieveLean;
    },
  },
  methods: {
    deletedCustomAttr(option) {
      if (option.terminated) {
        return 'entity-terminated';
      }
      if (option.deleted) {
        return 'entity-deleted';
      }
      if (option.providerConfirmed) {
        return 'provider-confirmed';
      }
      return '';
    },
  },
};
