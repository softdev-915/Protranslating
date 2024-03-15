/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import { mapActions } from 'vuex';
import ColorInput from '../../../color-input/color-input.vue';
import { errorNotification } from '../../../../utils/notifications';

const colorKeyToTitle = {
  inlineUserTags: 'Inline User Tags',
  inlineSystemTags: 'Inline System Tags',
  qaErrorMessages: 'QA Error Messages',
  qaWarningMessages: 'QA Warning Messages',
};
const uniqueColors = ['qaErrorMessages', 'qaWarningMessages'];

export default {
  components: {
    ColorInput,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  watch: {
    value(newValue, prevValue) {
      this.handleColorsValidationResult(this.validateColors(newValue, prevValue), prevValue);
    },
  },
  data() {
    return {
      visibleColorPicker: '',
      colorInputSelector: 'advanced',
    };
  },
  methods: {
    ...mapActions('notifications', ['pushNotification']),
    toggleColorPicker(visibleColorPicker) {
      this.visibleColorPicker = this.visibleColorPicker === visibleColorPicker
        ? null : visibleColorPicker;
    },
    update(key, value) {
      this.$emit('input', _.set(_.cloneDeep(this.value), key, value));
    },
    handleColorsValidationResult(result, prevValue) {
      if (_.isNil(result)) {
        return;
      }
      const keyToUndo = _.first(result);
      const colorToUndoTitle = colorKeyToTitle[keyToUndo];
      const existingColorTitle = colorKeyToTitle[result[1]];
      this.pushNotification(errorNotification(`${colorToUndoTitle} color can’t be the same as ${existingColorTitle} color`));
      const prevColor = _.get(prevValue, `${keyToUndo}.color`);
      this.update(`${keyToUndo}.color`, prevColor);
    },
    validateColors(uiSettings, prevUiSettings) {
      for (const key of uniqueColors) {
        const setting = uiSettings[key];
        for (const otherKey of uniqueColors) {
          if (key !== otherKey) {
            const otherSetting = uiSettings[otherKey];
            const prevOtherSetting = prevUiSettings[otherKey];
            if (setting.color === otherSetting.color &&
                otherSetting.color !== prevOtherSetting.color) {
              return [otherKey, key];
            }
          }
        }
      }
    },
  },
};
