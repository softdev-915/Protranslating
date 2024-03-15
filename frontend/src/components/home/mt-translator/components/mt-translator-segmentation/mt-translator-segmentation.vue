<template>
  <div class="row justify-content-between" v-if="inited">
    <div class="col-6 justify-content-between">
      <div class="row">
        <div
            v-if="canReadAll || canReadCompany"
            class="col-6 col-lg-3 pts-clickable"
            @click="onSegmentsClick"
            data-e2e-type="mt-translator-view-mode-switch">
          <div class="switch-container">
            <i
                class="fas pts-clickable"
                :class="{ 'fa-toggle-off': !isSegmentsActive, 'fa-toggle-on': isSegmentsActive }">
            </i>
            <span>Segments</span>
          </div>
        </div>
        <div v-if="canReadAll" class="col-6 col-lg-4 d-flex align-items-center">
          <span class="mr-2">Segmentation</span>
          <simple-basic-select
            class="segmentation-type-selector"
            :value="settings.segmentationType"
            @input="changeSegmentationType"
            :options="segmentationTypes"
            :disabled="isSegmentationTypeDisabled"
            data-e2e-type="mt-translator-segmentation-type" />
        </div>
        <div class="col-12 col-lg-5 mt-2 mt-lg-0" v-if="isCompanySelectVisible">
          <company-select
            data-e2e-type="mt-translator-segmentation-company"
            placeholder="Select Company"
            :selected-option="selectedCompany"
            :filter="companyFilter"
            @select="changeCompany" />
        </div>
      </div>
    </div>
    <div class="col-6 col-md-5 col-lg-4 d-flex align-items-center">
          <span class="text-right w-100 mr-2">Max # of suggestions</span>
          <input
            data-e2e-type="mt-translator-max-suggestions"
            class="form-control"
            type="number"
            @input="changeMaxSuggestions"
            :value="settings.maxSuggestions"
          />
    </div>
  </div>
</template>

<script src="./mt-translator-segmentation.js"></script>
<style lang="scss" scoped>
@import '../../../../../styles/colors.scss';

.switch-container{
  display: flex;
  align-items: center;
  justify-content: left;
  border-radius: 4px;
  border: 1px solid $button-new-default-border;
  background: $color-white;
  height: 34px;
  padding: 0 8px;
  span {
    margin-bottom: 0;
    margin-left: 5px;
  }
  i {
    font-size: 22px;
  }
  .fa-toggle-on{
    color: $button-new-primary-background;
  }
}

.segmentation-type-selector{
  width: 100%;
}
</style>
