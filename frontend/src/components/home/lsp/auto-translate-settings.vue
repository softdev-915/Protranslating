<template>
  <div class="row">
    <div class="col-12 mt-1">
      <h5>Google Vision Settings</h5>
      <hr class="my-1" />
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2 pl-4">
            Confidence level
            <span class="pts-required-field">*</span>
          </div>
          <div class="col-12 col-md-1" :class="{'has-danger': errors.has('minimumConfidenceLevel')}">
            <input
              v-model.number="autoTranslateSettings.minimumConfidenceLevel"
              type="number"
              step="0.1"
              min="0"
              max="1"
              name="minimumConfidenceLevel"
              class="form-control"
              v-validate="'required|minimumConfidenceLevel'"
              data-e2e-type="lsp-settings-minimum-confidence-level">
          </div>
          <div class="form-control-feedback" data-e2e-type="lsp-settings-minimum-confidence-level-error" v-if="errors.has('minimumConfidenceLevel')">
            <span v-if="errors.first('minimumConfidenceLevel')">{{errors.first('minimumConfidenceLevel')}}</span>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2 pl-4">
            File Output
            <span class="pts-required-field">*</span>
          </div>
            <basic-select
              placeholder="Select File Output Format"
              title="File Output"
              :options="fileOutputVariants"
              :selected-option="selectedOutputVariant"
              @select="onOutputFormatSelect"
              data-e2e-type="lsp-settings-output-format"
            ></basic-select>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./auto-translate-settings.js"></script>
