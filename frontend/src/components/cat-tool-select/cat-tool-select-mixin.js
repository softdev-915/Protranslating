import CatToolService from '../../services/cat-tool-service';
import ServiceRequestLocker from '../../services/service-request-locker';

const service = new CatToolService();
const serviceRequestLocker = new ServiceRequestLocker(service);

export const catToolSelectMixin = {
  props: {
    catTools: Array,
    filter: {
      type: Function,
      default: () => (ct) => !ct.deletedAt,
    },
    showDeleted: {
      type: Boolean,
    },
    placeholder: String,
    title: String,
  },
  created() {
    if (this.catTools) {
      this.catToolList = this.catTools;
      this.loading = false;
    } else if (this.fetchOnCreated) {
      this._retrieve();
    }
  },
  data() {
    return {
      catToolList: [],
      loading: true,
      selected: null,
    };
  },
  watch: {
    selected(newSelected) {
      this.$emit('input', newSelected);
    },
  },
  computed: {
    options() {
      if (this.catToolList) {
        return this.catToolList.filter(this.filter).map((catTool) => (
          { value: catTool.name, text: catTool.name }
        ));
      }
      return [];
    },
  },
  methods: {
    _retrieve() {
      this.loading = true;
      let params = {};
      if (this.showDeleted !== undefined) {
        params = { filter: JSON.stringify({ inactiveText: this.showDeleted.toString() }) };
      }
      serviceRequestLocker.retrieve(params).then((response) => {
        this.catToolList = response.data.list;
      }).finally(() => {
        this.loading = false;
      });
    },
    onSelect(newSelection) {
      if (Array.isArray(newSelection)) {
        this.selected = newSelection.map((s) => s.value);
      } else {
        this.selected = newSelection.value;
      }
    },
  },
};
