import _ from 'lodash';
import Promise from 'bluebird';
import { mapActions, mapGetters } from 'vuex';
import { AjaxBasicSelect } from '../search-select';
import { hasRole } from '../../utils/user';

// Add non inherited props from mixins
const MixinProps = AjaxBasicSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(AjaxBasicSelect.props, MixinProps);
const CUSTOM_PROPS = ['retrieve', 'httpClient', 'http-client', 'selected-option', 'selectedOption'];
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
  name: 'referenceable-ajax-basic-select',
  props: {
    value: {
      type: Object,
    },
    rolesRequired: {
      type: [Array],
      default() {
        return [];
      },
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
                _id: v._id,
                name: v.name,
              },
              text: v.name,
            };
          }
          return {
            value: '',
            text: '',
          };
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
      selected: {
        text: '',
        value: {
          _id: '',
          name: '',
        },
      },
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
    _.set(context, 'props.selectedOption', this.referenceableSelectedOption);
    _.set(context, 'on.select', this.onOptionSelect);
    return h(AjaxBasicSelect, context);
  },
  watch: {
    value: {
      deep: true,
      immediate: true,
      handler(newValue) {
        const _id = _.get(newValue, '_id');
        const name = _.get(newValue, 'name');
        if (_.isNil(_id)) {
          this.selected = null;
        } else {
          this.selected = {
            text: name,
            value: {
              _id,
              name,
            },
          };
        }
      },
    },
    selected(newSelected) {
      if (_.get(this.value, '_id') !== _.get(newSelected, 'value._id')
        || _.get(this.value, 'name') !== _.get(newSelected, 'text')) {
        let newValue = null;
        if (!_.isNil(newSelected) && !_.isNil(newSelected.value)) {
          newValue = {};
          newValue._id = _.get(newSelected, 'value._id');
          newValue.name = _.get(newSelected, 'value.name');
        }
        this.$emit('input', newValue);
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
      const selected = f(this.value);
      return selected;
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onOptionSelect(value) {
      if (_.get(value, 'value', '')) {
        this.selected = value;
      } else {
        this.selected = null;
      }
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
