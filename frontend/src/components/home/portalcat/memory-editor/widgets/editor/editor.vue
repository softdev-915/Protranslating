<template>
  <widget v-on="$listeners" v-bind="widgetProps" data-e2e-type="memory-editor-editor-widget">
    <template slot="title">
      <editor-segment-actions
        :can-create="canCreate"
        :can-delete="canDelete"
        @add="onAddSegment"
        @delete="onDeleteSegment"/>
    </template>
    <template slot="menubar">
      <editor-menubar v-model="editorParams"/>
    </template>

    <div class="memory-editor-editor">
      <editor-search
        title="Search and Replace"
        @replace="onReplace"
        @search="onSearch"
        @clear="onSearchClear"
        @current-result-change="onSearchCurrentResultChange"
        :users="tmUsers"
        :search-results="searchedSegments"
        :can-edit="canEdit"/>

      <h5 v-if="!segments.length && !segmentToCreate" class="text-center mt-5" data-e2e-type="empty-tm-text">No segments in this TM</h5>
      <h5 v-else-if="segmentsToDisplay && !segmentsToDisplay.length && showOnlySearchedSegments" class="text-center mt-5" data-e2e-type="no-segments-found-text">No segments found</h5>

      <dynamic-scroller
        ref="dScroller"
        data-e2e-type="memory-editor-segments"
        class="scroller"
        :items="segmentsToDisplay"
        :min-item-size="74"
        :key="scrollerKey">
        <template scope="{ item, index, active }">
          <dynamic-scroller-item
            :item="item"
            :active="active"
            :index="index"
            :size-dependencies="[ segmentById(item).target.text, segmentById(item).source.text, activeSegmentsArray ]">
            <editor-segment
              @mousedown="onSegmentMouseDown"
              @click="onSegmentClicked($event, item)"
              @create-segment="onCreateSegment"
              @validation="onSegmentValidation($event, item)"
              @save="onSaveSegment"
              @custom-copy="onCustomCopy"
              :clipboard="clipboard"
              :special-chars="specialChars"
              :isActive="isSegmentActive(item)"
              :layout="layout"
              :segmentId="item"
              :catUiSettings="catUiSettings"
              :format-tag-fn="formatTag"
              :format-text-fn="formatText"
              :can-edit="canEdit"
              :are-all-tags-as-numbers="areAllTagsAsNumbers"
              :index="index"/>
          </dynamic-scroller-item>
        </template>
      </dynamic-scroller>
    </div>
  </widget>
</template>

<script src="./editor.js"></script>
<style src="./editor.scss" lang="scss" scoped></style>
