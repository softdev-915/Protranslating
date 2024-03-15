import _ from 'lodash';
import { mapActions } from 'vuex';
import { AjaxBasicSelect } from '../search-select';
import providerResource from '../../resources/provider';
import UserService from '../../services/user-service';
import { toUserName } from '../../utils/user';

const CUSTOM_PROPS = ['filter', 'options', 'retrieve', 'http-client', 'httpClient', 'customAttr', 'custom-attr'];
const CUSTOM_LISTENERS = ['searchchange'];
const userService = new UserService(providerResource);
const USER_LIMIT = 10;
// Add non inherited props from mixins
const MixinProps = AjaxBasicSelect.mixins.filter((m) => m.props)
  .reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxBasicSelect.props, MixinProps);
const deletedCustomAttr = (option) => {
  if (option.terminated) {
    return 'entity-terminated';
  }
  if (option.deleted) {
    return 'entity-deleted';
  }
  if (option.escalated) {
    return 'provider-escalated';
  }
  return '';
};

export default {
  data() {
    return {
      user: [],
      timeoutId: null,
      retrievingParameters: {
        term: null,
        page: 0,
        filter: {},
      },
    };
  },
  props: {
    formatOption: {
      type: Function,
      default: toUserName,
    },
    filter: {
      type: Object,
      default: () => ({
        name: null,
        ability: null,
        language: null,
        catTool: null,
        deleted: null,
        terminated: null,
        providerConfirmed: null,
        limit: USER_LIMIT,
      }),
    },
    extraFilter: {
      type: Function,
      default: null,
    },
    timeoutMillis: {
      type: Number,
      default: 2000,
    },
    loadingIconClass: {
      type: String,
      default: 'fas fa-spin fa-circle-o-notch',
    },
    customAttr: {
      type: Function,
      default: deletedCustomAttr,
    },
    retrieve: {
      type: Function,
      default: (params) => userService.retrieveProviders(params),
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  watch: {
    filter(newVal, oldVal) {
      if (this.$refs.abs && this.$refs.abs.resetData && !_.isEqual(newVal, oldVal)) {
        // if the ajax basic select exist and the filter changes
        // reset the initial data to force the component
        // reset the first 10 values upon filter changes.
        this.$refs.abs.resetData();
      }
    },
  },
  computed: {
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onSearchChange(text) {
      this.triggerDelayedSearch(text);
    },
    httpClient(term, page) {
      if (!this.isRetrieving(term, page)) {
        this.retrievingParameters = { term, page };
        return this._requestUsers(term, page);
      }
      return Promise.resolve();
    },
    isRetrieving(term = '', page) {
      const pageBeingRetrieved = _.get(this, 'retrievingParameters.page', 0);
      const termBeingRetrieved = _.get(this, 'retrievingParameters.term', '');
      const filterBeingRetrieved = _.get(this, 'retrievingParameters.filter', {});
      return pageBeingRetrieved === page
      && termBeingRetrieved === term
      && _.isEqual(this.filter, filterBeingRetrieved);
    },
    triggerDelayedSearch(term) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this._requestUsers(term);
      }, this.timeoutMillis);
    },
    _requestUsers(term, page = 0) {
      if (this.filter !== null) {
        const filter = { limit: USER_LIMIT, skip: USER_LIMIT * page };
        if (term) {
          if (this.extraFilter) {
            Object.assign(filter, this.filter, this.extraFilter(term));
          } else {
            Object.assign(filter, this.filter, { name: term });
          }
        } else {
          Object.assign(filter, this.filter);
        }
        this.$emit('users-loading', true);
        return this.retrieve(filter)
          .then((response) => {
            const users = response.data.list;
            return users.map((u) => ({
              value: u._id,
              text: this.formatOption(u),
              terminated: u.terminated,
              type: u.type,
              providerConfirmed: u.providerConfirmed,
              escalated: u.escalated,
              deleted: u.deleted,
              email: u.email,
              firstName: u.firstName,
              lastName: u.lastName,
              flatRate: u.flatRate,
            }));
          }).catch((err) => {
            this.pushNotification({
              title: 'Error',
              message: 'Could not retrieve users',
              state: 'danger',
              response: err,
            });
          }).finally(() => {
            this.retrievingParameters = { term: null, page: 0, filter: _.clone(this.filter) };
            this.$emit('users-loading', false);
          });
      }
      // if no filter, not even an empty object provider
      // always return empty array
      return Promise.resolve([]);
    },
  },
};
