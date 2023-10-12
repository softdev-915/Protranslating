<template>
  <multi-select
    ref="languageCombinationSelect"
    :class="{ 'blur-loading-row': loading }"
    :options="options"
    :selected-options="selectedOptions"
    placeholder="Select Language Combinations"
    :hide-selected="false"
    @select="onLanguageSelected"/>
</template>

<script>
import _ from 'lodash';
import { MultiSelect } from '../search-select';
import LanguageService from '../../services/language-service';

const CUSTOM_PROPS = ['options', 'selectedOptions', 'isDisabled'];
const MixinProps = MultiSelect.mixins.filter((m) => m.props).reduce((acc, cur) => ({ ...acc, ...cur.props }), {});
const VueSearchSelectInheritedProps = { ...MultiSelect.props, ...MixinProps };
const languageService = new LanguageService();
const buildInitialState = () => ({
  loading: false,
  options: [],
  searchText: '',
  items: [],
  lastSelectItem: {},
});

export default {
  name: 'LanguageCombinationSelect',
  components: {
    MultiSelect,
  },
  props: {
    value: { type: Array, required: true },
    maxSelected: { type: Number },
    shouldRetrieve: { type: Boolean, default: true },
    ..._.omit(VueSearchSelectInheritedProps, CUSTOM_PROPS),
  },
  created() {
    if (this.shouldRetrieve) this._retrieve();
  },
  data() {
    return buildInitialState();
  },
  computed: {
    selectedOptions() {
      return this.value.map(v => ({ text: v.text, value: v.value }));
    },
  },
  methods: {
    onLanguageSelected(items, selectedItem, action) {
      const newLanguageText = _.get(selectedItem, 'text', '');
      let langs = _.cloneDeep(this.value);
      const len = langs.length;
      const lastIndex = len - 1;
      if (action === 'delete') {
        langs = langs.filter(l => l.text !== selectedItem.text);
      } else if (len > 0 && langs[lastIndex].text.match(/-$/)) {
        langs[lastIndex].text = `${langs[lastIndex].text} ${newLanguageText}`;
        langs[lastIndex].value = [langs[lastIndex].value[0], selectedItem];
        const itemIndex = langs.findIndex(l => l.text === langs[lastIndex].text);
        if (itemIndex !== lastIndex) {
          langs.pop();
        }
      } else if (len === this.maxSelected) {
        langs = [{ text: `${newLanguageText} -`, value: [selectedItem] }];
      } else {
        langs.push({ text: `${newLanguageText} -`, value: [selectedItem] });
      }
      this.$emit('input', langs);
      // Ugly hack to mantain the language selector open after selection
      try {
        // I give the user some love by trying to reopen the language combination input.
        const input = this.$refs.languageCombinationSelect.$el.querySelector('input');
        // trigger a blur
        input.blur();
        // after 100 milliseconds I focus on the input thus reopening the searchbox
        input.focus();
      } catch (e) {
        // If browser does not support the querySelector OR vuejs API change,
        // we ignore this error and move on with our lives
      }
    },
    _retrieve() {
      this.loading = true;
      languageService.retrieve()
        .then((response) => {
          const languages = _.get(response, 'data.list', []);
          this.options = languages.map((l) => ({ value: l.isoCode, text: l.name }));
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
</script>
