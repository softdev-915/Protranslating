import _ from 'lodash';
import Promise from 'bluebird';
import { mapActions, mapGetters } from 'vuex';
import { AjaxMultiSelect } from '../search-select';
import { hasRole } from '../../utils/user';

// Add non inherited props from mixins
const MixinProps = AjaxMultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxMultiSelect.props, MixinProps);
const CUSTOM_PROPS = ['retrieve', 'httpClient', 'http-client', 'selected-option', 'selectedOptions'];
const _retrieveFromServerFactory = (vm) => (term, page) => {
  if (vm.hasAccess) {
    vm.loading = true;
    const params = { limit: vm.limit, skip: vm.limit * page };
    const filter = {};
    if (term) {
      Object.assign(filter, vm.filter, { name: term });
    } else {
      Object.assign(filter, vm.filter);
    }
    params.filter = filter;
    return vm.retrieve(params).then((response) => _.map(response.data.list, (rn) => ({
      text: rn.name,
      value: _.pick(rn, ['_id', 'name']),
    }))).catch((err) => {
      vm.pushNotification({
        title: 'Error',
        message: `Could not retrieve ${vm.entity}`,
        response: err,
        state: 'danger',
      });
    }).finally(() => {
      vm.loading = false;
    });
  }
  return Promise.reject(new Error(`User does not have permissions to retrieve ${vm.entity}`));
};

export default {
  name: 'referenceable-ajax-multi-select',
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    rolesRequired: {
      type: Array,
      default: () => [],
    },
    entity: {
      type: String,
      default() {
        return 'entity';
      },
    },
    selectedOptionFactory: {
      type: Function,
      default() {
        return (v) => {
          if (!_.isEmpty(v)) {
            return {
              value: {
                _id: _.get(v, '_id'),
                name: _.get(v, 'name'),
              },
              text: _.get(v, 'name'),
            };
          }
          return [];
        };
      },
    },
    filter: {
      type: Object,
      default: () => ({}),
    },
    limit: {
      type: Number,
      default: 10,
    },
    retrieve: {
      type: Function,
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  data() {
    return {
      loading: false,
      selected: [{
        text: '',
        value: {
          _id: '',
          name: '',
        },
      }],
    };
  },
  render(h) {
    const context = {
      props: this.$props,
      attrs: this.$attrs,
      on: this.$listeners,
    };
    _.set(context, 'attrs', this.$attrs);
    _.set(context, 'props.httpClient', _retrieveFromServerFactory(this));
    _.set(context, 'props.selectedOptions', this.referenceableSelectedOption);
    _.set(context, 'on.select', this.onOptionSelect);
    return h(AjaxMultiSelect, context);
  },
  watch: {
    value: {
      deep: true,
      immediate: true,
      handler(newValue) {
        if (!_.isEmpty(newValue)) {
          const arrValues = _.map(newValue, (v) => {
            const _id = _.get(v, '_id');
            const name = _.get(v, 'name');
            return {
              text: name,
              value: {
                _id,
                name,
              },
            };
          });
          this.selected = arrValues;
        } else {
          this.selected = [];
        }
      },
    },
    selected(newSelected, oldSelected) {
      if (newSelected.length !== oldSelected.length) {
        this.$emit('input', _.map(newSelected, (i) => i.value));
      }
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    hasAccess() {
      return _.every(this.rolesRequired, (role) => {
        if (role && role.oneOf) {
          return _.some(role.oneOf, (r) => hasRole(this.userLogged, r));
        }
        return hasRole(this.userLogged, role);
      });
    },
    referenceableSelectedOption() {
      const f = this.selectedOptionFactory();
      return _.map(this.value, f);
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onOptionSelect(value) {
      this.selected = value;
    },
    _retrieveOptions(params) {
      if (_.isFunction(this.options)) {
        return this._retrieveFromServer(this.options, params);
      }
      if (_.isArray(this.options)) {
        this.selectOptions = this.options;
      }
    },
  },
};
