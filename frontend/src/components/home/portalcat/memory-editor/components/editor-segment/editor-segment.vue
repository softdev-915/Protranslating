<template>
  <div
    class="editor-segment-wrapper"
    data-e2e-type="memory-editor-segment"
    :data-segment-id="segmentId"
    :data-e2e-index="index">
    <div
      class="editor-segment"
      @click="$emit('click', $event)"
      @mousedown="$emit('mousedown', $event)"
      :class="[isConfirmed ? 'confirmed' : '', isActive ? 'active' : '', layout]">
      <template v-if="layout === 'rows'">
        <div class="segment-content" data-e2e-type="editor-segment-rows">
          <div class="row">
            <div class="col col-12">
              <span
                data-e2e-type="editor-segment-source"
                class="source"
                style="user-drag: none;"
                ref="source"
                v-on="sourceEventListeners"
                contenteditable></span>
              <div ref="availableSourceTagsDiv" class="available-tags" v-if="areAvailableSourceTagsShown">
                <tags-list :tags="availableSourceTags" :formatFn="formatTag" @tag-picked="onTagPicked($event, 'source')"/>
              </div>
            </div>
            <div class="col col-12">
              <span
                class="target"
                :class="{'disabled': !canEdit}"
                data-e2e-type="editor-segment-target"
                v-on="targetEventListeners"
                :contenteditable="canEdit"
                ref="target"></span>
              <div ref="availableTagsDiv" class="available-tags" v-if="areAvailableTagsShown">
                <tags-list :tags="availableTargetTags" :formatFn="formatTag" @tag-picked="onTagPicked($event, 'target')"/>
              </div>
            </div>
          </div>
        </div>
        <div class="segment-footer row justify-content-between">
          <div class="col-auto">
            <div class="segment-info">
              <div class="row justify-content-between align-items-center">
                <div class="col-auto">
                  <div class="translation-info">
                    <div class="type type-mt" v-if="isMT">MT</div>
                    <div class="type type-ht" v-else-if="isHT">HT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-auto">
            <div class="actions">
              <i v-show="isSegmentLoading" class="fas fa-spinner in-progress"></i>
              <button class="fas fa-plus" :disabled="!isActive" title="Add User Tag" @mousedown.prevent="" @click="onAddUserTag"></button>
              <button class="fas fa-code" :disabled="!isActive" title="Toggle tags"></button>
              <button
                v-if="!isNew"
                class="confirm"
                :title="isConfirmed ? 'Unconfirm segment (Ctrl/Cmd + Shift + Enter)' : 'Confirm segment (Ctrl/Cmd + Enter)'">
                <status-icon :with-title="false" :status="status"/>
              </button>
              <button
                v-else
                :disabled="!isValid || isSegmentCreationInProgress"
                @click="$emit('create-segment', segment)"
                class="btn btn-secondary confirm"
                title="Save segment">
                <i v-if="isSegmentCreationInProgress" class="fas fa-spinner in-progress"></i>
                <i v-else class="fas fa-save"></i>
              </button>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="segment-content" data-e2e-type="editor-segment-columns">
          <div class="row no-gutters">
            <div class="col">
              <div class="source-container">
                <span
                  data-e2e-type="editor-segment-source"
                  class="source"
                  style="user-drag: none;"
                  ref="source"
                  v-on="sourceEventListeners"
                  contenteditable></span>
              <div ref="availableSourceTagsDiv" class="available-tags" v-if="areAvailableSourceTagsShown">
                <tags-list :tags="availableSourceTags" :formatFn="formatTag" @tag-picked="onTagPicked($event, 'source')"/>
              </div>
              </div>
            </div>
            <div class="col-auto">
              <div class="translation-info-container">
                <div class="translation-info">
                  <span class="type type-mt" v-if="isMT">MT</span>
                  <span class="type type-ht" v-else-if="isHT">HT</span>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="target-container">
                <div class="row">
                  <div class="col-12">
                    <span
                      class="target"
                      :class="{'disabled': !canEdit}"
                      data-e2e-type="editor-segment-target"
                      :contenteditable="canEdit"
                      v-on="targetEventListeners"
                      ref="target"></span>
                    <div ref="availableTagsDiv" class="available-tags" v-if="areAvailableTagsShown">
                      <tags-list :tags="availableTargetTags" :formatFn="formatTag" @tag-picked="onTagPicked($event, 'target')"/>
                    </div>
                  </div>
                  <div class="col-auto ml-auto">
                    <i v-show="isSegmentLoading" class="fas fa-spinner in-progress"></i>
                    <button class="fas fa-plus" :disabled="!isActive || !canEdit" title="Add User Tag" @mousedown.prevent="" @click="onAddUserTag"></button>
                    <button class="fas fa-code" :disabled="!isActive" title="Toggle tags" @click="toggleTagsAsNumbers"></button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-auto">
              <div class="confirm-container">
                <button
                  v-if="!isNew"
                  class="btn btn-secondary confirm"
                  :disabled="!canEdit"
                  :title="isConfirmed ? 'Unconfirm segment (Ctrl/Cmd + Shift + Enter)' : 'Confirm segment (Ctrl/Cmd + Enter)'">
                  <status-icon :with-title="false" :status="status"/>
                </button>
                <button
                  v-else
                  :disabled="!isValid || isSegmentCreationInProgress"
                  @click="$emit('create-segment', segment)"
                  class="btn btn-secondary confirm"
                  title="Save segment">
                  <i v-if="isSegmentCreationInProgress" class="fas fa-spinner in-progress"></i>
                  <i v-else class="fas fa-save"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script src="./editor-segment.js"></script>
<style src="./editor-segment.scss" lang="scss"></style>
