import VariableDescription from './variable-description.vue';

export default {
  name: 'variables-reference',
  components: {
    VariableDescription,
  },
  props: {
    vars: {
      type: Object,
      default: () => {},
    },
    parentPath: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      visible: {},
    };
  },
  computed: {
    varList() {
      if (this.vars) {
        return Object.keys(this.vars);
      }
      return [];
    },
  },
  methods: {
    setVisible(variable, visible) {
      this.$set(this.visible, variable, visible);
    },
  },
};
