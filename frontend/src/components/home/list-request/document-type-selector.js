import _ from 'lodash';
import { mapGetters, mapActions } from 'vuex';
import { MultiSelect } from '../../search-select';
import { selectMixin } from '../../../mixins/select-mixin';
import DocumentTypeService from '../../../services/document-type-service';
import { hasRole } from '../../../utils/user';

const CUSTOM_PROPS = ['options', 'selected-options', 'selectedOptions'];
const CUSTOM_LISTENERS = ['select'];
// Add non inherited props from mixins
const MixinProps = MultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = { ...MultiSelect.props, ...MixinProps };
const service = new DocumentTypeService();
const buildInitialState = () => ({
  options: [],
  loading: false,
});

export default {
  mixins: [selectMixin],
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    documentTypesAvailable: {
      type: Array,
    },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  data() {
    return buildInitialState();
  },
  created() {
    if (this.documentTypesAvailable) {
      this.options = this.documentTypesAvailable;
    }
  },
  computed: {
    ...mapGetters('app', ['userLogged']),
    selected() {
      return this.value.map((v) => {
        const _id = _.get(v, 'value', _.get(v, '_id', v));
        const found = this.options.find((o) => o._id === _id);
        const name = _.get(found, 'name', _.get(v, 'name', ''));
        return { text: name, value: _id };
      });
    },
    documentTypeOptions() {
      if (Array.isArray(this.options)) {
        return this.options.map((d) => ({
          text: d.name,
          value: d._id,
        }));
      }
      return [];
    },
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    canRetrieve() {
      return hasRole(this.userLogged, 'DOCUMENT-TYPE_READ_ALL');
    },
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    onDocumentTypeSelected(documentTypes) {
      this.$emit('input', documentTypes.map((documentType) => ({
        name: _.get(documentType, 'text'),
        _id: _.get(documentType, 'value'),
      })));
    },
    _retrieve() {
      if (this.canRetrieve) {
        this.loading = true;
        return service.retrieve()
          .then((response) => {
            this.options = response.data.list;
          })
          .catch((err) => {
            const notification = {
              title: 'Error',
              message: 'Document types could not be retrieved',
              state: 'danger',
              response: err,
            };
            this.pushNotification(notification);
          })
          .finally(() => {
            this.loading = false;
          });
      }
    },
  },
};
