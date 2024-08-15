import _ from 'lodash';
import LspLogosService from '../../../services/lsp-logos-service';
import AjaxSelectMixin from '../../../mixins/ajax-select-mixin';

export default {
  name: 'TemplateLogosAjaxSelect',
  mixins: [AjaxSelectMixin],
  created() {
    this.service = new LspLogosService();
  },
  props: {
    filter: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  data() {
    return {
      filterField: 'searchTerm',
      selectedOption: {
        text: 'BIG Language Solutions',
        value: 'BIG Language Solutions_logo.svg',
      },
    };
  },
  methods: {
    async _requestList(term, page) {
      let records = [];
      const filterClone = _.clone(this.filter);
      filterClone[this.filterField] = term;
      if (term === '') delete filterClone[this.filterField];
      const params = {
        limit: 10,
        page,
        filter: JSON.stringify(filterClone),
      };
      try {
        const response = await this.service.retrieve(params);
        records = _.get(response, 'data.list', []).map(this.formatOption);
        const selectedOption = records.find(record => record.value === _.get(this.value, 'value'));
        if (!_.isNil(selectedOption)) {
          this.selectedOption = selectedOption;
        }
      } catch (e) {
        this.pushError(e.message, e);
      }
      return records;
    },
    onOptionSelect(selectedOption) {
      this.$emit('logo-name-selected', selectedOption);
    },
    formatOption(option) {
      return { value: option.path, text: option.name };
    },
  },
};
