<template>
  <div class="h-100 bg-light mt-translator-body" data-e2e-type="mt-translator-body">
    <div class="container-fluid" v-if="inited">
      <div class="row align-items-center">
        <div class="col-12"><h3 class="mt-5 mb-5">Portal Translator</h3></div>
      </div>
      <div class="row">
        <div class="col-12">
          <div v-if="!areLanguagesSelected || !hasSupportedSegmentationRules">
            <div
                data-e2e-type="mt-translator-language-warning"
                class="alert alert-warning"
                v-if="!areLanguagesSelected">
              Please select a source and target language.
            </div>
            <div
                data-e2e-type="mt-translator-srx-warning"
                class="alert alert-warning"
                v-if="isSourceLanguageSelected && !hasSupportedSegmentationRules">
              No SRX file found for the {{settings.segmentationType}}. Please upload an SRX file for the source language.
            </div>
          </div>
          <div
              data-e2e-type="mt-translator-model-warning"
              class="alert alert-warning"
              v-if="showSuggestionModelWarning">
            In the Display section, select from which models to display suggestions
          </div>
        </div>
      </div>
      <div class="row align-items-center mb-2">
        <div class="col-12" >
          <mt-translator-settings
            :can-read-all="canReadAll"
            :can-read-company="canReadCompany"
            :mt-models="mtModels"
            :show-required-fields="showSuggestionModelWarning"
            @settings-change="onSettingsChange"
            :settings="settings" />
        </div>
      </div>
      <div class="row align-items-center mb-2">
        <div class="col-12">
          <mt-translator-editor
            :can-read-all="canReadAll"
            :can-read-company="canReadCompany"
            :settings="settings"
            :is-segments-active="isSegmentsActive"
            :active-model="activeModel"
            :segmentation-rule="activeSegmentationRule"
            :suggestion-models="suggestionModels"
            @set-mt-node="setMtNode"
            />
        </div>
      </div>
      <div class="row align-items-center mb-2">
        <div class="col-12">
          <mt-translator-segmentation
            :can-read-all="canReadAll"
            :can-read-company="canReadCompany"
            :settings="settings"
            @settings-change="onSettingsChange"
            :is-segments-active="isSegmentsActive"
            @segments-active-toggle="onSegmentsActiveToggle"
            @active-sr-change="setActiveSegmentationRule"
            @segmentation-rules-received="setSegmentationRules"
          />
        </div>
      </div>
      <mt-translator-info
        v-if="canReadAll"
        :mt-model="activeModelName"
        :mt-node="mtNode"
      />
    </div>
    <div v-else>
      <i class="fas fa-spinner fa-pulse fa-fw"></i>
    </div>
  </div>
</template>

<script src="./mt-translator.js"></script>
<style lang="scss" scoped>
.mt-translator-body{
  overflow: auto;
}
</style>
