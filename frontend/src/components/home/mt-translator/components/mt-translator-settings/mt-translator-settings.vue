<template>
  <div class="row">
    <div class="col-6">
      <div class="row">
        <div class="col-lg-3 col-md-12">
          <div class="row mb-2">
            <div class="col-12">Translate From</div>
          </div>
          <div class="row mb-2 mb-lg-0">
            <div class="col-12">
              <simple-basic-select
                  :value="settings.sourceLanguage"
                  @input="changeSourceLanguage"
                  :options="sourceLanguages"
                  :disabled="isLanguageSelectDisabled"
                  :format-option="formatLanguage"
                  entity-name="Language"
                  :empty-option="{ value: '', text: 'None' }"
                  data-e2e-type="mt-translator-source-language-selector" />
            </div>
          </div>

        </div>
        <div class="col-lg-9 col-md-12" v-if="canReadAll">
          <div class="row mb-2">
            <div class="col-12">Models</div>
          </div>
          <div class="row">
            <div class="col-md-12 col-lg-3">
              <div class="checkbox-container mb-2 mb-lg-0">
                <input
                    id="general-checkbox"
                    type="checkbox"
                    :checked="settings.isGeneral"
                    @change="(e)=>changeIsGeneral(e.target.checked)"
                    :disabled="isGeneralDisabled"
                    data-e2e-type="mt-translator-is-general-checkbox" />
                <label for="general-checkbox">General</label>
              </div>
            </div>
            <div class="col-md-12 col-lg-4">
              <simple-basic-select
                class="mb-2 mb-lg-0"
                placeholder="Industry"
                :value="settings.industry"
                @input="changeIndustry"
                :options="industries"
                :disabled="isIndustryDisabled"
                :format-option="formatIndustry"
                entity-name="Industry"
                data-e2e-type="mt-translator-industry-selector" />
            </div>
            <div class="col-md-12 col-lg-5">
              <simple-basic-select
                class="mb-2 mb-lg-0"
                placeholder="Client"
                :value="currentClient"
                @input="changeClient"
                :options="clients"
                :disabled="isClientDisabled"
                entity-name="Client"
                :format-option="formatClient"
                data-e2e-type="mt-translator-client-selector" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-6">
      <div class="row justify-content-between">
        <div class="col-lg-3 col-md-12">
          <div class="row mb-2">
            <div class="col-12">Translate To</div>
          </div>
          <div class="row mb-2 mb-lg-0">
            <div class="col-12">
              <simple-basic-select
                  entity-name="TargetLanguage"
                  :value="settings.targetLanguage"
                  @input="changeTargetLanguage"
                  :format-option="formatLanguage"
                  :options="targetLanguages"
                  :empty-option="{ value: '', text: 'None' }"
                  :disabled="isLanguageSelectDisabled"
                  data-e2e-type="mt-translator-target-language-selector" />
            </div>
          </div>
        </div>
        <div v-if="canReadAll" class="col-lg-8 col-xl-7">
          <div class="row mb-2">
            <div class="col-12">Display</div>
          </div>
          <div class="row">
            <div class="col-4">
              <div class="checkbox-container mb-2 mb-lg-0" :class="{'required': showRequiredFields}">
                <input
                    id="is-display-general-checkbox"
                    type="checkbox"
                    :checked="settings.isDisplayGeneral"
                    @change="changeIsDisplayGeneral"
                    data-e2e-type="mt-translator-general-suggestion-checkbox" />
                <label for="is-display-general-checkbox">General</label>
              </div>
            </div>
            <div class="col-4">
              <div class="checkbox-container mb-2 mb-lg-0" :class="{'required': showRequiredFields}">
                <input
                    id="is-display-industry-checkbox"
                    type="checkbox"
                    :checked="settings.isDisplayIndustry"
                    @change="changeIsDisplayIndustry"
                    data-e2e-type="mt-translator-industry-suggestion-checkbox" />
                <label for="is-display-industry-checkbox">Industry</label>
              </div>
            </div>
            <div class="col-4">
              <div class="checkbox-container mb-2 mb-lg-0" :class="{'required': showRequiredFields}">
                <input
                    id="is-display-client-checkbox"
                    type="checkbox"
                    :checked="settings.isDisplayClient"
                    @change="changeIsDisplayClient"
                    data-e2e-type="mt-translator-client-suggestion-checkbox" />
                <label for="is-display-client-checkbox">Client</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./mt-translator-settings.js"></script>
<style lang="scss" scoped>
@import '../../../../../styles/colors.scss';

.checkbox-container{
  display: flex;
  align-items: center;
  justify-content: left;
  border-radius: 4px;
  border: 1px solid $button-new-default-border;
  background: $color-white;
  height: 34px;
  padding: 0 8px;
  label {
    margin-bottom: 0;
    margin-left: 5px;
  }

  &.required{
    border-color: $color-red;
  }
}
</style>
