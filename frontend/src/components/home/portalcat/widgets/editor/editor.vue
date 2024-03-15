<template>
  <widget
    v-on="$listeners"
    v-bind="widgetProps"
    data-e2e-type="portalcat-editor-widget"
    :class="{ 'blur-loading-row': isPipelineInProgress }">
    <template slot="icon">
      <i :class="iconClass" title="Editor" data-e2e-type="widget-icon"></i>
    </template>
    <template slot="menubar">
      <editor-menubar
        v-model="editorParams"
        @search="toggleSearch"
        @additional-filters-change="commonEditorFilters = $event"
        @lock-segments="$emit('lock-segments')"
        :additional-filters="commonEditorFilters"
        :isEditorEmpty="isEmpty"/>
    </template>
    <div class="portalcat-editor">
      <editor-search
        v-if="isSearchVisible"
        :value="searchParams"
        :omit-fields="['requests']"
        :search-results="searchedSegmentsArray"
        :active-segment="!!activeSegmentsArray ? activeSegmentsArray[0] : null"
        @current-result-change="onSearchCurrentResultChange"
        @search="onSearch"
        @replace="onReplace"
        @clear="onSearchClear"
        title="Search + Replace in Task Files (Ctrl+H)"/>

      <h5 v-if="isRepetitionsFilterOn && !repetitions.length" class="text-center mt-5">No repetitions in the request</h5>
      <h5 v-else-if="!isRepetitionsFilterOn && !segments.length" class="text-center mt-5" data-e2e-type="no-segments-in-file-text">No segments in this file</h5>
      <h5 v-else-if="!segmentsToDisplay.length && showOnlySearchedSegments" class="text-center mt-5" data-e2e-type="no-segments-text">No segments found</h5>

      <template v-else>
        <dynamic-scroller
          ref="dScroller"
          class="scroller"
          data-e2e-type="portalcat-editor-segments"
          :items="segmentsToDisplay"
          :min-item-size="74"
          :key="layout">
          <template scope="{ item, index, active }">
            <dynamic-scroller-item
              :item="item"
              :active="active"
              :size-dependencies="[ (segmentById(item) && segmentById(item).target.text), activeSegmentsArray, areTagsExpanded ]"
              :index="index">
              <editor-segment
                @mousedown="onSegmentMouseDown"
                @click="onSegmentClicked($event, item, index)"
                @caret-set="caretCurrentPosition = $event"
                @source-blur="onSourceBlur"
                @tag-expanded="onSegmentTagExpanded"
                @validation="onSegmentValidation($event, item)"
                @save="onSaveSegment"
                @confirm="onSegmentConfirm"
                @custom-copy="onCustomCopy"
                @update-tte="onUpdateTte"
                @add-recent-action="addRecentAction($event)"
                @set-caret-params="caretParams = $event"
                :caretParams="caretParams"
                :is-repetitions-filter-on="isRepetitionsFilterOn"
                :clipboard="clipboard"
                :special-chars="specialChars"
                :isActive="isSegmentActive(item)"
                :segmentId="item"
                :layout="layout"
                :catUiSettings="catUiSettings"
                :format-tag-fn="formatTag"
                :format-text-fn="formatText"
                :segment-by-id-fn="segmentByIdFn"
                :are-all-tags-as-numbers="areAllTagsAsNumbers"/>
            </dynamic-scroller-item>
          </template>
        </dynamic-scroller>
      </template>

      <repetitions-warning-modal ref="repetitionsWarningModal" data-e2e-type="repetitions-warning-modal"/>
    </div>
  </widget>
</template>

<script src="./editor.js"></script>
<style lang="scss" src="./editor.scss"></style>
