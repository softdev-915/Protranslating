<template>
  <div class="container-fluid" data-e2e-type="portalcat-settings">
    <div class="row">
      <div class="col-12 col-md-6">
        <div class="form-group row">
          <label class="col-12 col-md-4">MT Engine</label>
          <div class="col-12 col-md-8">
            <basic-select
              placeholder="Select MT Engine"
              title="MT Engine"
              :options="mtEngines"
              :selected-option="mtEngineSelected"
              @select="onMtEngineSelect"
              data-e2e-type="mt-engine-basic-select"
              :is-disabled="!canEdit"/>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="form-group row">
          <label class="col-12 col-md-4" data-e2e-type="mt-threshold-label">
            MT Threshold (%)
            <span class="pts-required-field">*</span>
          </label>
          <div
            class="col-12 col-md-8"
            :class="{ 'has-danger': errors.has('mtThreshold') }">
            <input
              type="number"
              name="mtThreshold"
              class="form-control"
              :disabled="!canEdit"
              :value="mtThreshold"
              @input="update('mtThreshold', $event)"
              v-validate="'required|mtThreshold'"
              data-e2e-type="mt-threshold-input"/>
            <div
              class="form-control-feedback"
              data-e2e-type="mt-threshold-error"
              v-if="errors.has('mtThreshold')">
              <span v-if="errors.firstByRule('mtThreshold', 'mtThreshold')">Enter a number between 0 and 100</span>
              <span v-else>{{ errors.first("mtThreshold") }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-6">
        <div class="form-group row">
          <label class="col-12 col-md-4">Supported File Formats</label>
          <div
            class="col-12 col-md-8"
            :class="{ 'has-danger': !isValidSupportedFileFormats }">
            <multi-select
              placeholder="Select Formats"
              title="Supported File Formats"
              name="supportedFileFormats"
              :options="documentTypes"
              :selected-options="supportedFileFormatsSelected"
              @select="onSupportedFileFormatsSelect"
              data-e2e-type="supported-file-formats-multi-select"
              :is-disabled="!canEdit"></multi-select>
            <div
              class="form-control-feedback"
              data-e2e-type="supported-file-formats-error"
              v-if="!isValidSupportedFileFormats">
              Unsupported file type
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="my-4" data-e2e-type="pc-locked-segments" v-if="lockedSegmentsExists">
      <div class="row">
        <h6>Locked Segments</h6>
      </div>
      <div class="form-group row mt-2">
        <div class="col-12">
          <label>Locked Segments</label>
        </div>
        <div class="col-12 col-md-6">
          <multi-select
            placeholder="Select Segments"
            title="Locked Segments"
            name="lockedSegments"
            :options="breakdowns"
            :selected-options="lockedSegmentsSelected"
            @select="onLockedSegmentsSelect"
            data-e2e-type="pc-locked-segments-multi-select"
            :is-disabled="!canEdit"></multi-select>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-12">
          <label>Include Locked Segments in</label>
        </div>
        <div class="col-12 col-md-6 d-table">
          <div class="d-table-cell mr-2">
            <label for="includeInClientStatistics">
              <input
                data-e2e-type="client-statistics"
                id="includeInClientStatistics"
                name="includeInClientStatistics"
                type="checkbox"
                :disabled="!canEdit"
                v-model="value.lockedSegments.includeInClientStatistics"/>
              <span>Client Statistics</span>
            </label>
          </div>
          <div class="d-table-cell mr-2">
            <label for="includeInProviderStatistics">
              <input
                data-e2e-type="provider-statistics"
                id="includeInProviderStatistics"
                name="includeInProviderStatistics"
                type="checkbox"
                :disabled="!canEdit"
                v-model="value.lockedSegments.includeInProviderStatistics"/>
              <span>Provider Statistics</span>
            </label>
          </div>
        </div>
      </div>
      <div class="mt-2">
        <label class="d-block">Change Segment Status to 'Confirmed by'</label>
        <div class="form-group row col-12 col-md-6">
          <div class="d-flex align-items-center ml-2">
            <input
              type="radio"
              name="segment-confirmed-by"
              v-model="value.lockedSegments.newConfirmedBy"
              value="CONFIRMED_BY_TRANSLATOR"
              :disabled="!canUpdateRadioButtons"
              data-e2e-type="pc-segment-confirmed-by-translator">
            <label class="mb-0 ml-1">Translator</label>
          </div>
          <div class="d-flex align-items-center ml-4">
            <input
              type="radio"
              name="segment-confirmed-by"
              v-model="value.lockedSegments.newConfirmedBy"
              value="CONFIRMED_BY_EDITOR"
              :disabled="!canUpdateRadioButtons"
              data-e2e-type="pc-segment-confirmed-by-post-editor">
            <label class="mb-0 ml-1">Editor/Post-Editor</label>
          </div>
          <div class="d-flex align-items-center ml-4">
            <input
              type="radio"
              name="segment-confirmed-by"
              v-model="value.lockedSegments.newConfirmedBy"
              value="CONFIRMED_BY_QA_EDITOR"
              :disabled="!canUpdateRadioButtons"
              data-e2e-type="pc-segment-confirmed-by-qa-editor">
            <label class="mb-0 ml-1">QA Editor</label>
          </div>
        </div>
      </div>
    </div>
    <h6>SRX File Management</h6>
    <sr-management :resourcesService="resourcesService" />
  </div>
</template>

<script src="./pc-settings.js"></script>
