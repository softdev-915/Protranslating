<template>
  <div class="row" data-e2e-type="mt-translator-editor-view">
    <div class="col-6">
      <textarea
        v-if="canDisplayTextArea"
        @input="onSourceInput"
        :disabled="isDisabled"
        placeholder="Input text here and press Enter to produce a translation."
        class="form-control source"
        ref="source"
        @keydown.enter.prevent="translate"
        data-e2e-type="mt-translator-source-field">{{isSegmentationCompleted ? sourceStringFromSegments : text}}</textarea>
      <editor-field
        v-else
        :segments="segmentedText"
        :active-segment="activeSegment"
        :show-suggestions="false"
        @select-segment="selectSegment"
        @input="changeSourceSegment"
        @enter-key="translate"
        @clear="clearSource"
        e2e-type="source"
      />
    </div>
    <div class="col-6">
      <editor-field
        :segments="translatedText"
        :active-segment="activeSegment"
        :show-suggestions="true"
        :settings="settings"
        :suggestion-models="suggestionModels"
        :is-loading="isSegmentationLoading || isTranslationLoading"
        :source-segments="segmentedText"
        e2e-type="target"
        @input="onTargetInput"
        @select-segment="selectSegment"
        @set-mt-node="setMtNode"
      />
      <button
          class="btn btn-default pull-right mt-2"
          @click="copyTargetToClipboard"
          e2e-type="copy-to-clipboard-button"
      >Copy to clipboard</button>
    </div>
  </div>
</template>

<script src="./editor-view.js"></script>
<style scoped lang="scss" src="./editor-view.scss"></style>
