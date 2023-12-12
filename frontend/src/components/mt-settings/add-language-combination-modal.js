import _ from 'lodash';
import LanguageCombinationSelect from '../language-combination-selector/index.vue';

export default {
  components: { LanguageCombinationSelect },
  props: {
    defaultMtEngine: {
      type: String,
      required: true,
    },
    isDefaultPortalMt: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      languageCombinations: [],
    };
  },
  computed: {
    isValid() {
      return this.isValidLanguageCombinations;
    },
    isValidLanguageCombinations() {
      return !_.isEmpty(this.languageCombinations) &&
        this.languageCombinations.every(combination => combination.value.length === 2);
    },
  },
  methods: {
    show() {
      this.$refs.modal.show();
    },
    hide() {
      this.$refs.modal.hide();
    },
    save() {
      const data = {
        languageCombinations: this.languageCombinations.map(combination => ({
          srcLang: combination.value[0].value,
          tgtLang: combination.value[1].value,
          text: combination.text,
          mtEngine: this.defaultMtEngine,
          isPortalMt: this.isDefaultPortalMt,
        })),
      };
      this.$emit('save-combinations', data);
      this.hide();
      this.resetState();
    },
    resetState() {
      this.languageCombinations = [];
    },
  },
};
