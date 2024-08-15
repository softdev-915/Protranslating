<template>
  <div class="pl-0 mt-2 w-100">
    <h4 class="body__header" data-e2e-type="claimed-translation-title">
      EP Granted Claims Translation
    </h4>
    <p class="body__text" data-e2e-type="claimed-translation-text">
      I need the text intended for Grant Claims translated in response to the intention to Grant notice 71(3)
    </p>
    <div class="row mt-3 ml-auto">
      <form>
        <ip-radio-button
          data-e2e-type="claimed-translation-yes-button"
          @input="onClaimsTranslationChecked"
          name='claims-translation-granted'
          :value="claimsTranslationGranted">
          Yes
        </ip-radio-button>
        <ip-radio-button
          data-e2e-type="claimed-translation-no-button"
          class="ml-3"
          @input="onClaimsTranslationUnchecked"
          :value="!claimsTranslationGranted">
          No
        </ip-radio-button>
      </form>
    </div>
    <div v-if="translationOnly && claimsTranslationGranted" class="mt-3 ml-auto">
      <p class="body__text" data-e2e-type="claims-translationGranted-text">
        I need the granted claims translated into the following other official languages
      </p>
      <div class="mt-3 ml-auto row">
        <ip-checkbox
          v-for="otherLanguage in details.otherLanguages"
          :key="otherLanguage.isoCode"
          :data-e2e-type="`claimed-language-${otherLanguage.name}`"
          class="mr-3 has-danger"
          :label="otherLanguage.name"
          v-model="otherLanguage.selected"
          :id="otherLanguage.isoCode"/>
      </div>
    </div>
    <div v-if="claimsTranslationGranted" class="mt-3 ml-auto row justify-content-between d-flex claims-translation-inputs">
      <ip-date-input
        class="col-md-5 col-sm-12 mt-1"
        placeholder="Requested delivery date for claims translation"
        data-e2e-type="requested-delivery-date-claims-translation"
        v-model="details.requestedDeliveryDateClaimsTranslation"
        required/>
      <ip-input
        placeholder="Statutory deadline for claims submission in response to 71(3)"
        class="col-md-6 col-sm-12 mt-1"
        data-e2e-type="statutory-deadline"
        :disabled="true"
        :value="statutoryDeadlineExists ? formatDate(details.statutoryDeadline) : 'N/A'"/>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import IpDateInput from '../components/ip-date-input.vue';
import IpInput from '../components/ip-input.vue';
import IpRadioButton from '../components/ip-radio-button.vue';
import IpCheckbox from '../components/ip-checkbox.vue';
import { stringDate } from '../../../../utils/handlebars/date';

const OTHER_LANGUAGES = [{
  name: 'English',
  isoCode: 'EN',
}, {
  name: 'French',
  isoCode: 'FR',
}, {
  name: 'German',
  isoCode: 'DE',
}];

export default {
  name: 'GrantedClaimsTranslation',
  components: {
    IpDateInput,
    IpInput,
    IpRadioButton,
    IpCheckbox,
  },
  props: {
    translationOnly: {
      type: Boolean,
      default: false,
    },
    epo: {
      type: Object,
      default: () => ({}),
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    details: {
      otherLanguages: [],
      requestedDeliveryDateClaimsTranslation: null,
      statutoryDeadline: '',
    },
  }),
  computed: {
    claimsTranslationGranted: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('input', newValue);
      },
    },
    statutoryDeadlineExists() {
      const statutoryDeadline = _.defaultTo(this.details.statutoryDeadline, '');
      return !_.isEmpty(statutoryDeadline);
    },
    isValidClaimsTranslation() {
      if (this.claimsTranslationGranted) {
        return _.filter(this.details.otherLanguages, (l) => l.selected).length > 0
          && !_.isEmpty(_.defaultTo(this.details.requestedDeliveryDateClaimsTranslation, null));
      }
      return true;
    },
    claimsTranslationGrantedText() {
      return this.claimsTranslationGranted ? 'Yes' : 'No';
    },
  },
  watch: {
    details: {
      deep: true,
      handler() {
        this.$emit('on-granted-claims-update', this.details);
      },
    },
    epo(newValue, oldValue) {
      if (!_.isEqual(newValue, oldValue)) {
        _.assign(this.details, _.defaultTo(newValue, {}));
      }
    },
    isValidClaimsTranslation() {
      this.$emit('claims-translation-validation', this.isValidClaimsTranslation);
    },
  },
  created() {
    const otherLanguagesSaved = _.get(this.epo, 'otherLanguages', []);
    const otherLanguagesSelected = otherLanguagesSaved.filter((l) => l.selected);
    if (!_.isEmpty(otherLanguagesSelected)) {
      this.details.otherLanguages = otherLanguagesSaved;
    } else {
      this.details.otherLanguages = this.getDefaultOtherLanguages();
    }
    this.details.requestedDeliveryDateClaimsTranslation = _.get(this.epo, 'requestedDeliveryDateClaimsTranslation', null);
    this.details.statutoryDeadline = _.get(this.epo, 'statutoryDeadline', '');
    this.formatDate = stringDate;
  },
  methods: {
    onClaimsTranslationChecked() {
      this.claimsTranslationGranted = true;
    },
    onClaimsTranslationUnchecked() {
      this.claimsTranslationGranted = false;
      this.details.otherLanguages = this.getDefaultOtherLanguages();
      this.details.requestedDeliveryDateClaimsTranslation = null;
      this.$emit('on-granted-claims-update', this.details);
    },
    getDefaultOtherLanguages() {
      return OTHER_LANGUAGES
        .filter((otherLanguage) => otherLanguage.isoCode !== this.epo.sourceLanguage)
        .map((otherLanguage) => ({ ...otherLanguage, selected: false }));
    },
  },
};
</script>

<style scoped lang="scss" src="../create.scss"></style>
<style scoped lang="scss" src="./patent-details.scss"></style>
