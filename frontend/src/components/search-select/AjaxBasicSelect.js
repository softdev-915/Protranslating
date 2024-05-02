import common from './common';
import baseMixin from './mixins/baseMixin';
import commonMixin from './mixins/commonMixin';
import optionAwareMixin from './mixins/optionAwareMixin';

export default {
  mixins: [baseMixin, commonMixin, optionAwareMixin],
  props: {
    showMissingOptions: {
      type: Boolean,
      default: false,
    },
    selectedOption: {
      type: Object,
      default: () => ({ value: '', text: '' }),
    },
    loadingIconClass: {
      type: String,
    },
    httpClient: {
      type: Function,
      required: true,
    },
    delayMillis: {
      type: Number,
      default: 500,
    },
    limit: {
      type: Number,
      default: 10,
    },
  },
  created() {
    this.originalValue = this.selectedOption;
    if (this.fetchOnCreated) {
      this._requestAsyncData({ term: '', delayMillis: 0, toggleShow: false });
    }
  },
  data() {
    return {
      showMenu: false,
      timeoutId: null,
      loading: false,
      searchText: '',
      lastTermSearched: null,
      currentSearch: null,
      httpClientChanged: false,
      page: 0,
      exhaustedResults: false,
      originalValue: { text: '', value: '' },
      mousedownState: false, // mousedown on option menu
      pointer: 0,
      allOptions: [],
    };
  },
  computed: {
    optionsWithOriginal() {
      if (this.originalValue.value && this.showMissingOptions) {
        const hasOriginalValue = this.allOptions.filter((o) => o.value === this.originalValue).length === 1;
        if (!hasOriginalValue) {
          return this.allOptions.concat([this.originalValue]);
        }
      }
      return this.allOptions;
    },
    searchTextCustomAttr() {
      if (this.selectedOption && this.selectedOption.value) {
        return this.customAttr(this.selectedOption);
      }
      return '';
    },
    inputText() {
      if (this.searchText) {
        return '';
      }
      let text = this.placeholder;
      if (this.selectedOption.text) {
        text = this.selectedOption.text;
      }
      return text;
    },
    customAttrs() {
      try {
        if (Array.isArray(this.optionsWithOriginal)) {
          return this.optionsWithOriginal.map((o) => this.customAttr(o));
        }
      } catch (e) {
        // if there is an error, just return an empty array
      }
      return [];
    },
    textClass() {
      if (!this.selectedOption.text && this.placeholder) {
        return 'default';
      }
      return '';
    },
    menuClass() {
      return {
        visible: this.showMenu,
        hidden: !this.showMenu,
      };
    },
    menuStyle() {
      return {
        display: this.showMenu ? 'block' : 'none',
      };
    },
    dynamicClass() {
      if (this.loading && this.loadingIconClass) {
        return `icon-right ${this.loadingIconClass}`;
      }
      return 'icon';
    },
  },
  watch: {
    value() {
      this._requestAsyncData({ term: '', delayMillis: 0, toggleShow: false });
    },
    searchText(newTerm) {
      this.exhaustedResults = false;
      if (this.$refs.input === document.activeElement) {
        this._requestAsyncData({ term: newTerm });
      }
    },
    disabled(newDisabled) {
      if (!newDisabled) {
        this._requestAsyncData({ term: '', delayMillis: 0, toggleShow: false });
      }
    },
    httpClient() {
      this.httpClientChanged = true;
    },
  },
  methods: {
    deleteTextOrItem() {
      if (!this.searchText && this.selectedOption) {
        this.selectItem({});
        this.openOptions();
      }
    },
    openOptions() {
      common.openOptions(this);
      if ((this.selectedOption && this.selectedOption.value) || !this.fetchOnCreated) {
        this._requestAsyncData({ term: this.searchText, delayMillis: 0, toggleShow: false });
      }
    },
    blurInput() {
      common.blurInput(this);
    },
    closeOptions() {
      common.closeOptions(this);
    },
    prevItem() {
      common.prevItem(this);
    },
    nextItem() {
      common.nextItem(this);
    },
    enterItem() {
      common.enterItem(this);
    },
    pointerSet(index) {
      common.pointerSet(this, index);
    },
    pointerAdjust() {
      common.pointerAdjust(this);
    },
    mousedownItem() {
      common.mousedownItem(this);
    },
    resetData(forceHttpRequest = true) {
      this.searchText = '';
      this.closeOptions();
      this._requestAsyncData({
        term: '', delayMillis: 0, toggleShow: false, forceHttpRequest,
      });
    },
    selectItem(option) {
      this.searchText = ''; // reset text when select item
      this.closeOptions();
      this.$emit('select', option);
      this.$refs.input.blur();
    },
    onScroll(scrollEvent) {
      const element = scrollEvent.target;
      const offset = element.scrollTop + element.offsetHeight;
      const height = element.scrollHeight;

      if (offset >= height && !this.exhaustedResults && !this.loading) {
        this._requestAsyncData({
          term: this.searchText, delayMillis: 0, page: this.page + 1, toggleShow: false,
        });
      }
    },
    _requestAsyncData({
      term, delayMillis = this.delayMillis,
      toggleShow = true, page = 0, forceHttpRequest = false,
    }) {
      if (
        (term !== this.lastTermSearched && term !== this.currentSearch)
        || page > 0 || this.httpClientChanged || forceHttpRequest
      ) {
        this.httpClientChanged = false;
        this.currentSearch = term;
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
          this.loading = true;
          if (toggleShow) {
            this.showMenu = false;
          }
          this.httpClient(term, page).then((arr) => {
            this.page = page;
            if (page === 0) {
              this.allOptions = arr;
            } else if (arr.length) {
              this.allOptions = this.allOptions.concat(arr);
            }
            this.exhaustedResults = arr.length < this.limit;
            if (toggleShow) {
              this.showMenu = true;
            }
          }).catch((err) => {
            this.$emit('ajax-select-error', err);
          }).finally(() => {
            this.timeoutId = null;
            this.loading = false;
            this.lastTermSearched = term;
            this.currentSearch = null;
          });
        }, delayMillis);
      }
    },
  },
};
