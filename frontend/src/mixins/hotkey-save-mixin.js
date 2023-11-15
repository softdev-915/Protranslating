import _ from 'lodash';
import { commandKeyCodes } from '../utils/browser';

const S_KEY = 83;

export const hotkeySaveMixin = {
  data() {
    return {
      commandKeyCodes: [],
      commandPressed: false,
    };
  },
  mounted() {
    this.commandKeyCodes = commandKeyCodes();
    this.registerSaveHotkey();
  },
  destroyed() {
    document.onkeydown = () => true;
  },
  computed: {
    canSave() {
      return _.get(this, 'isValid', true);
    },
  },
  methods: {
    ctrlKeyPressed: function (e) {
      if (this.commandKeyCodes.length === 0) {
        return e.ctrlKey;
      }
      return this.commandPressed;
    },
    registerSaveHotkey() {
      document.onkeyup = () => {
        this.commandPressed = false;
      };
      document.onkeydown = (e) => {
        const keyCodePressed = e.which || e.keyCode;
        if (this.commandKeyCodes.indexOf(keyCodePressed) >= 0) {
          this.commandPressed = true;
        }
        if (keyCodePressed === S_KEY && this.ctrlKeyPressed(e)) {
          e.preventDefault();
          if (this.canSave && !document.saving) {
            this.save();
          }
        }
      };
    },
  },
};
