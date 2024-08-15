import PtsEmailInput from '../../../form/pts-email-input.vue';
import TemplateEditor from '../../../template-editor/template-editor.vue';

export default {
  components: {
    PtsEmailInput,
    TemplateEditor,
  },
  props: {
    value: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      from: '',
      template: '',
      subject: '',
      variables: {},
      fromValid: false,
    };
  },
  watch: {
    value: function (newValue) {
      if (newValue.from !== this.from) {
        this.from = newValue.from;
      }
      if (newValue.template !== this.template) {
        this.template = newValue.template;
      }
      if (newValue.variables !== this.variables) {
        this.variables = newValue.variables;
      }
      if (newValue.subject !== this.subject) {
        this.subject = newValue.subject;
      }
    },
    from: function () {
      this.emitState();
    },
    template: function () {
      this.emitState();
    },
    subject: function () {
      this.emitState();
    },
  },
  computed: {
    isValidEmailFrom: function () {
      return this.fromValid;
    },
    isValidSubject: function () {
      return this.subject !== '';
    },
    isValidTemplate: function () {
      return this.template !== '';
    },
  },
  methods: {
    emitState() {
      this.$emit('input', {
        from: this.from,
        template: this.template,
        variables: this.variables,
        subject: this.subject,
      });
    },
    onEmailValidation(valid) {
      this.fromValid = valid;
    },
    onTemplateError(error) {
      this.$emit('template-error', error);
    },
    onTemplateSanitizing(sanitizing) {
      this.$emit('template-sanitizing', sanitizing);
    },
  },
};
