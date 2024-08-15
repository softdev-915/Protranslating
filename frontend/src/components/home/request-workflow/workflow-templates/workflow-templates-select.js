import _ from 'lodash';
import SimpleBasicSelect from '../../../form/simple-basic-select.vue';
import WorkflowTemplateService from '../../../../services/workflow-template-service';
import notificationMixin from '../../../../mixins/notification-mixin';

export default {
  name: 'WorkflowTemplatesSelect',
  mixins: [notificationMixin],
  components: {
    SimpleBasicSelect,
  },
  props: {
    companyId: {
      type: String,
      required: true,
    },
    languageCombinations: {
      type: Array,
      required: true,
    },
  },
  created() {
    this._service = new WorkflowTemplateService();
    this.optionFormatter = option => ({ text: option.name, value: option });
  },
  data: () => ({
    options: [],
  }),
  watch: {
    languageCombinations() {
      if (!_.isEmpty(this.options)) {
        this.options = [];
      }
    },
  },
  methods: {
    retrieveTemplates() {
      if (!_.isEmpty(this.options)) {
        return;
      }

      this._service.retrieve({
        companyId: this.companyId,
        languageCombinations: this.languageCombinations,
      })
        .then((res) => {
          this.options = res.data.list;
        })
        .catch(() => {
          this.pushError('Failed to retrieve workflow templates');
        });
    },
    onInput(value) {
      this.$emit('input', value);
    },
  },
};
