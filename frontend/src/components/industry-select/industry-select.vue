<template>
  <simple-basic-select
    v-model="valueWrapper"
    :options="industryList"
    :format-option="formatOption"
    @click.native="retrieveOptions"
    v-bind="wrappedProps"
    v-on="wrappedListeners"
    entity-name="Industry"
  />
</template>
<script>
import _ from 'lodash';
import IndustryService from '../../services/industry-service';
import { selectMixin } from '../../mixins/select-mixin';
import SimpleBasicSelect from '../form/simple-basic-select.vue';

const CUSTOM_PROPS = ['value', 'formatOption'];
const CUSTOM_LISTENERS = ['input'];
const service = new IndustryService();

export default {
  components: { SimpleBasicSelect },
  mixins: [selectMixin],
  props: {
    value: {
      type: String,
      required: true,
    },
    formatOption: {
      type: Function,
      default: industryValue => ({
        text: industryValue,
        value: industryValue,
      }),
    },
    ..._.omit(SimpleBasicSelect.props, CUSTOM_PROPS),
  },
  data() {
    return {
      industryList: [],
    };
  },
  computed: {
    wrappedProps() {
      return _.omit(this.$props, CUSTOM_PROPS);
    },
    wrappedListeners() {
      return _.omit(this.$listeners, CUSTOM_LISTENERS);
    },
    valueWrapper: {
      set(newValue) {
        this.$emit('input', newValue);
      },
      get() {
        return this.value;
      },
    },
  },
  methods: {
    _retrieve() {
      if (_.isEmpty(this.industryList)) {
        this.industryList = service.retrieve();
      }
    },
  },
};
</script>
