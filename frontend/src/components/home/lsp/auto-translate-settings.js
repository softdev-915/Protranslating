import _ from 'lodash';

const minimumConfidenceLevelRule = {
  getMessage() {
    return 'Enter a number between 0 and 1';
  },
  validate(value) {
    return _.inRange(value, 0, 2);
  },
};
const fileOutputVariants = ['Unformatted TXT', 'Unformatted PDF'];

export default {
  inject: ['$validator'],
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      autoTranslateSettings: {
        minimumConfidenceLevel: 0,
        fileOutput: 'Unformatted TXT',
      },
      fileOutputVariants: fileOutputVariants.map(v => ({ text: v, value: v })),
    };
  },
  created() {
    this.$validator.extend('minimumConfidenceLevel', minimumConfidenceLevelRule);
  },
  watch: {
    value: {
      handler: function (newValue) {
        this.autoTranslateSettings = newValue;
        this.validateForm();
      },
      deep: true,
    },
    autoTranslateSettings: {
      handler: function (newValue) {
        this.$emit('input', newValue);
      },
      deep: true,
    },
  },
  computed: {
    selectedOutputVariant() {
      const value = this.autoTranslateSettings.fileOutput;
      return { value, text: value };
    },
  },
  methods: {
    validateForm() {
      this.$nextTick(async () => {
        const isValid = await this.$validator.validateAll();
        this.$emit('validation', isValid);
      });
    },
    onOutputFormatSelect({ value }) {
      this.autoTranslateSettings.fileOutput = value;
    },
  },
};
