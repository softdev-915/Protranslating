<template>
  <div class="row">
    <div class="col-12">
      <div class="row">
        <div class="col-5">Document Margins</div>
        <div class="col-5 pr-0">
          <div class="row p-0">
            <div class="col-3 pr-0">Top</div>
            <div class="col-3 pl-2">Right</div>
            <div class="col-3 pl-0 pr-0">Bottom</div>
            <div class="col-3 pl-0">Left</div>
          </div>
        </div>
        <div class="col-2 px-3">Units</div>
      </div>
    </div>
    <div class="col-12">
      <div class="row pl-0 pr-0">
        <div class="col-5">
          <basic-select
            data-e2e-type="preview-margins-presets"
            :selected-option="selectedMarginPreset"
            :options="marginPresetOptions"
            @select="onMarginPresetsSelected"
            :isDisabled="disabled"
          />
        </div>
        <div class="col-5 pr-0 input-group">
          <input
            @input="setCustomMarginValue($event, 'top')"
            :value="marginsData.margins.top"
            :step="marginStep"
            :disabled="isDisabledOptions"
            type="number"
            min="0"
            class="form-control pr-0"
            data-e2e-type="preview-custom-margins-top"
          >
          <input
            @input="setCustomMarginValue($event, 'right')"
            :value="marginsData.margins.right"
            :step="marginStep"
            :disabled="isDisabledOptions"
            type="number"
            min="0"
            class="form-control pr-0"
            data-e2e-type="preview-custom-margins-right"
          >
          <input
            @input="setCustomMarginValue($event, 'bottom')"
            :value="marginsData.margins.bottom"
            :step="marginStep"
            :disabled="isDisabledOptions"
            type="number"
            min="0"
            class="form-control pr-0"
            data-e2e-type="preview-custom-margins-bottom"
          >
          <input
            @input="setCustomMarginValue($event, 'left')"
            :value="marginsData.margins.left"
            :step="marginStep"
            :disabled="isDisabledOptions"
            type="number"
            min="0"
            class="form-control pr-0"
            data-e2e-type="preview-custom-margins-left"
          >
        </div>
        <div class="col-2">
          <basic-select
            data-e2e-type="preview-custom-margins-unit"
            :selected-option="selectedUnitOption"
            :options="availableUnits"
            :isDisabled="isDisabledOptions"
            @select="onCustomMarginUnitSelected"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script src="./margins-select.js"></script>
