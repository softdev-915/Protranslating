<template>
  <div class="table-container" data-e2e-type="mt-translator-segment-view">
    <table class="segments-table w-100">
      <tr v-for="(text, index) in segmentedText" :class="{ 'segment-selected': index === activeSegment }" @click="selectSegment(index)">
        <td class="cell index-cell">{{index + 1}}</td>
        <td class="cell"><segment
          data-e2e-type="source-field-segment"
          :is-active="index === activeSegment"
          :text="text"
          :settings="settings"
          @delete-all="clearSource"
          @focus="selectSegment(index)"
          @input="changeSourceSegment"
          @get-translation="translate" /></td>
        <td v-if="isTranslationCompleted" class="cell">
          <segment
            data-e2e-type="target-field-segment"
            :is-active="index === activeSegment"
            :text="translatedText[index]"
            :settings="settings"
            :generate-suggestions="true"
            :suggestion-models="suggestionModels"
            :source-segment="segmentedText[index]"
            @set-mt-node="setMtNode"
            @focus="selectSegment(index)"
            @input="changeTranslatedSegment" />
        </td>
        <td v-else class="cell"></td>
      </tr>
    </table>
  </div>
</template>

<script src="./segment-view.js"></script>
<style scoped lang="scss" src="./segment-view.scss"></style>
