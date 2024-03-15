import _ from 'lodash';
import BrowserStorage from '../../utils/browser-storage';
import { marginPresetOptions, availableUnits } from './margin-select-const';

const localStore = new BrowserStorage('previewDocumentMargins');
const localStorageKey = 'previewMarginValues';

export default {
  props: {
    value: {
      type: Object,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedMarginPreset: this.getDefaultSelectedMargin(),
      customMarginValues: this.getDefaultCustomMarginValues(),
      selectedUnit: this.getDefaultSelectedUnit(),
      marginPresetOptions,
      availableUnits,
      oldMarginsData: null,
    };
  },
  computed: {
    marginsData() {
      const margins = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      let unit;
      if (this.isSelectedCustomPreset) {
        [
          margins.top,
          margins.right,
          margins.bottom,
          margins.left,
        ] = _.at(this.customMarginValues, ['top', 'right', 'bottom', 'left']);
        unit = _.get(this.selectedUnit, 'value', 'in');
      } else {
        [
          margins.top,
          margins.right,
          margins.bottom,
          margins.left,
        ] = _.at(this.selectedMarginPreset, ['value[0]', 'value[1]', 'value[2]', 'value[3]']);
        unit = _.get(this.selectedMarginPreset, 'unit', 'in');
      }
      return {
        label: this.selectedMarginPreset.text,
        margins,
        unit,
      };
    },
    selectedUnitOption() {
      return this.getUnitOptionByValue(this.marginsData.unit);
    },
    marginStep() {
      return _.get(this.selectedUnit, 'value') === 'in' ? 0.1 : 1;
    },
    isSelectedCustomPreset() {
      return this.selectedMarginPreset.text === 'Custom';
    },
    isDisabledOptions() {
      return this.disabled || !this.isSelectedCustomPreset;
    },
  },
  watch: {
    marginsData: {
      immediate: true,
      handler(newValue) {
        localStore.saveInCache(localStorageKey, newValue);
        this.$emit('input', newValue);
      },
    },
  },
  created() {
    this.oldMarginsData = { ...this.marginsData };
  },
  methods: {
    onMarginPresetsSelected(marginPreset) {
      this.selectedMarginPreset = marginPreset;
    },
    onCustomMarginUnitSelected(unit) {
      this.selectedUnit = unit;
    },
    getDefaultSelectedMargin() {
      const savedMarginsData = localStore.findInCache(localStorageKey);
      const selectedMargin = _.get(savedMarginsData, 'label', 'Default');
      return marginPresetOptions.find(marginPresetOption => (
        marginPresetOption.text === selectedMargin
      ));
    },
    getDefaultCustomMarginValues() {
      const defaultValue = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      const savedMarginsData = localStore.findInCache(localStorageKey);
      const selectedMargin = _.get(savedMarginsData, 'label', 'Default');
      if (selectedMargin !== 'Custom') {
        return defaultValue;
      }
      return _.get(savedMarginsData, 'margins', defaultValue);
    },
    getDefaultSelectedUnit() {
      const defaultUnit = availableUnits[0];
      const savedMarginsData = localStore.findInCache(localStorageKey);
      const selectedMargin = _.get(savedMarginsData, 'label', 'Default');
      if (selectedMargin !== 'Custom') {
        return defaultUnit;
      }
      const selectedCustomUnit = _.get(savedMarginsData, 'unit', defaultUnit);
      return this.getUnitOptionByValue(selectedCustomUnit);
    },
    getUnitOptionByValue(value, defaultUnit = availableUnits[0]) {
      const option = availableUnits.find(availableUnit => availableUnit.value === value);
      return !_.isEmpty(option) ? option : defaultUnit;
    },
    setCustomMarginValue(event, key) {
      this.customMarginValues[key] = event.target.value;
    },
    cancelMarginValuesChanges() {
      localStore.saveInCache(localStorageKey, this.oldMarginsData);
    },
  },
};
