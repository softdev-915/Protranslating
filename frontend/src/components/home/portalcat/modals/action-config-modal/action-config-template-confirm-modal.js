import _ from 'lodash';

const buildInitialTemplate = () => ({ _id: '', name: '' });

export default {
  props: {
    mode: {
      type: String,
      validator: (value) => {
        const validModes = ['create', 'update', 'hide'];
        if (!validModes.includes(value)) {
          console.warn(`Invalid prop: 'mode' must be one of ${validModes.join(', ')}`);
          return false;
        }
        return true;
      },
      required: true,
    },
  },

  data() {
    return {
      template: buildInitialTemplate(),
    };
  },
  computed: {
    isCreateMode() {
      return this.mode === 'create';
    },
    isUpdateMode() {
      return this.mode === 'update';
    },
    isHideMode() {
      return this.mode === 'hide';
    },
    isValid() {
      return !_.isEmpty(this.templateName);
    },
    templateName() {
      return _.get(this, 'template.name');
    },
    templateId() {
      return _.get(this, 'template._id');
    },
  },
  methods: {
    show(template) {
      Object.assign(this.template, template);
      this.$refs.modal.show();
      if (!_.isNil(this.$refs.nameInput)) {
        this.$refs.nameInput.focus();
      }
    },
    hide() {
      this.$refs.modal.hide();
      this.resetState();
    },
    submit() {
      this.$emit('submit', this.template);
      this.hide();
    },
    resetState() {
      this.template = buildInitialTemplate();
    },
  },
};
