/* global document */

import Vue from 'vue';
import _ from 'lodash';
import SuggestionDropdown from './suggestion-dropdown.vue';
import { store } from '../../../../../../stores/store';

export default {
  props: {
    settings: {
      type: Object,
    },
    source: {
      type: String,
    },
    prefix: {
      type: String,
    },
    input: {
      type: Function,
    },
    suggestionModels: {
      type: Object,
    },
    coords: {
      type: Object,
    },
    renderId: {
      type: String,
    },
  },
  components: {
    SuggestionDropdown,
  },
  created() {
    const ComponentClass = Vue.extend(SuggestionDropdown);

    this.dropdown = new ComponentClass({
      propsData: this._getDropdownProps(),
      store: store,
    });
    this.dropdown.$mount();
    this.dropdown.$on('input', this.$listeners.input);
    this.dropdown.$on('close', this.$listeners.close);
    this.dropdown.$on('set-mt-node', this.$listeners['set-mt-node']);
    this.dropdownRoot = document.getElementById(this.renderId);
    if (!_.isNil(this.dropdownRoot)) {
      this.dropdownRoot.appendChild(this.dropdown.$el);
    }
  },
  beforeDestroy() {
    this.dropdown.$off('input', this.$listeners.input);
    this.dropdown.$off('close', this.$listeners.close);
    this.dropdown.$off('set-mt-node', this.$listeners['set-mt-node']);
    this.dropdownRoot.removeChild(this.dropdown.$el);
    this.dropdown.$destroy();
  },
  methods: {
    _getDropdownProps() {
      return {
        source: this.source,
        prefix: this.prefix,
        suggestionModels: this.suggestionModels,
        coords: this.coords,
        settings: this.settings,
      };
    },
  },
};
