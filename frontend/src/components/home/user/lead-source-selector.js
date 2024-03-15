import _ from 'lodash';
import { mapActions, mapGetters } from 'vuex';
import { BasicSelect } from '../../search-select';
import { hasRole } from '../../../utils/user';
import LeadSourceService from '../../../services/lead-source-service';

const CUSTOM_PROPS = ['options', 'selected-option', 'selectedOption'];
const CUSTOM_LISTENERS = ['select'];
// Add non inherited props from mixins
const MixinProps = BasicSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = Object.assign(BasicSelect.props, MixinProps);
const leadSourceService = new LeadSourceService();

export default {
  props: {
    value: {
      type: Object,
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  data() {
    return {
      loading: false,
      options: [],
    };
  },
  created() {
    this._retrieveLeadSource();
  },
  watch: {
    value(newValue) {
      this.selected = newValue;
    },
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    hasAccess() {
      return hasRole(this.userLogged, 'LEAD-SOURCE_READ_ALL');
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    selectedLeadSource() {
      if (!_.isEmpty(this.value)) {
        return {
          value: this.value._id,
          text: this.value.name,
        };
      }
      return {
        value: '',
        text: '',
      };
    },
    leadSourceOptions() {
      if (_.get(this, 'options.length', 0) > 0) {
        return this.options.map((l) => ({
          text: l.name,
          value: l._id,
        }));
      }
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onLeadSourceSelected(leadSource) {
      const selected = this.options.find((o) => o._id === leadSource.value);
      this.$emit('input', selected);
    },
    _retrieveLeadSource() {
      if (this.hasAccess) {
        this.loading = true;
        return leadSourceService.retrieve().then((response) => {
          this.options = response.data.list.filter((e) => !e.deleted);
        })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Lead source could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          })
          .finally(() => {
            this.selected = this.value;
            this.loading = false;
          });
      }
    },
  },
};

