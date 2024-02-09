import _ from 'lodash';
import { mapActions } from 'vuex';
import { AjaxMultiSelect } from '../search-select';
import providerResource from '../../resources/provider';
import UserService from '../../services/user-service';

const CUSTOM_PROPS = ['filter', 'options', 'http-client', 'httpClient', 'optionValue'];
const CUSTOM_LISTENERS = ['searchchange'];
const userService = new UserService(providerResource);
const USER_LIMIT = 10;
// Add non inherited props from mixins
const MixinProps = AjaxMultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxMultiSelect.props, MixinProps);
const toUserName = (u) => {
  let name = '';
  if (u.firstName) {
    name = u.firstName;
  }
  if (u.lastName) {
    if (name) {
      name = `${name} ${u.lastName}`;
    } else {
      name = u.lastName;
    }
  }
  return name;
};

export default {
  data() {
    return {
      timeoutId: null,
      loadingOptions: false,
    };
  },
  props: {
    filter: {
      type: Object,
      default: () => ({
        name: null,
        ability: null,
        language: null,
        catTool: null,
        deleted: null,
        terminated: null,
        limit: USER_LIMIT,
      }),
    },
    timeoutMillis: {
      type: Number,
      default: 2000,
    },
    loadingIconClass: {
      type: String,
      default: 'fas fa-spin fa-circle-o-notch',
    },
    optionValue: { type: Function, default: ({ _id }) => _id },
    optionText: { type: Function, default: toUserName },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  watch: {
    filter: {
      deep: true,
      handler() {
        if (this.$refs.abs && this.$refs.abs.resetData) {
          // if the ajax multi select exist and the filter changes
          // reset the initial data to force the component
          // reset the first 10 values upon filter changes.
          this.$refs.abs.resetData();
        }
      },
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
      return this._requestUsers(term, page);
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
          Object.assign(filter, this.filter, { name: term });
        } else {
          Object.assign(filter, this.filter);
        }
        this.loadingOptions = true;
        return userService.retrieveProviders(filter)
          .then((response) => {
            const users = response.data.list;
            return users.map((u) => ({
              value: this.optionValue(u),
              text: this.optionText(u),
              terminated: u.terminated,
              deleted: u.deleted,
              providerConfirmed: u.providerConfirmed,
            }));
          }).catch((err) => {
            this.pushNotification({
              title: 'Error',
              message: 'Could not retrieve users',
              state: 'danger',
              response: err,
            });
          }).finally(() => {
            this.loadingOptions = false;
          });
      }
      // if no filter, not even an empty object provider
      // always return empty array
      return Promise.resolve([]);
    },
  },
};
