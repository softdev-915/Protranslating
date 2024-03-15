<template>
  <div class="editor-segment-wrapper" :class="{ showPopover }" data-e2e-type="editor-segment" :data-segment-id="segmentId">
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
                :class="{'disabled': isRequestCompleted}"
                oncut="return false;"
                onpaste="return false;"
                style="user-drag: none;"
                ondragenter="return false;"
                ondragleave="return false;"
                ondragover="return false;"
                ondrop="return false;"
                ref="source"
                @dragstart="onSourceDragStart"
                v-html="sourceTextDisplayed"
                v-on="sourceEventListeners"
                :contenteditable="!isRequestCompleted">
              </span> 
            </div>
            <div class="col col-12">
              <span
                class="target"
                :class="{'disabled': isDisabled}"
                data-e2e-type="editor-segment-target"
                :contenteditable="!isDisabled"
                ondragenter="this.focus()"
                v-on="targetEventListeners"
                ref="target"></span>
              <div ref="availableTagsDiv" class="available-tags" v-if="areAvailableTagsShown">
                <tags-list :tags="availableTargetTags" :formatFn="formatTag" @tag-picked="handleTagPicked($event, 'target')"/>
              </div>
              <suggestion-dropdown-mounter
                v-if="useMt && isSuggestionsDropdownOpen"
                :source="sourceText"
                :prefix="suggestionsPrefix"
                :suggestion-models="suggestionModels"
                :coords="caretCoords"
                :settings="{ sourceLanguage: suggestionsSourceLanguage, targetLanguage: suggestionsTargetLanguage }"
                @input="suggestionInput"
                @close="onSuggestionDropdownClose"
                render-id="suggestion-dropdown"
              />
            </div>
          </div>
        </div>
        <div class="segment-footer row justify-content-between">
          <div class="col-auto">
            <div class="segment-info">
              <div class="row justify-content-between align-items-center">
                <div class="col-auto">
                  <span class="index">{{ segmentNumber }}</span>
                </div>
                <div class="col-auto">
                  <div class="translation-info">
                    <i class="fas fa-lock" v-if="isLocked" data-e2e-type="editor-segment-locked"></i>
                    <span class="match mr-2" v-if="isMatched" data-e2e-type="editor-segment-match">{{ matchScore }}%</span>
                    <div class="type type-mt" v-if="isMT" data-e2e-type="editor-segment-origin-mt">MT</div>
                    <div class="type type-ht" v-else-if="isHT" data-e2e-type="editor-segment-origin-ht">HT</div>
                    <span class="type type-rt" v-if="isRepetitive" data-e2e-type="editor-segment-rt">RP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-auto">
            <div class="actions">
              <i v-show="isLoading" data-e2e-type="editor-segment-loader" class="fas fa-spinner in-progress"></i>
              <button
                class="fas fa-plus"
                data-e2e-type="editor-segment-add-tag-btn"
                :disabled="!isActive || isLocked || isRequestCompleted"
                title="Add User Tag"
                @mousedown.prevent=""
                @click="onAddUserTag">
              </button>
              <button
                class="fas fa-code"
                :class="{ toggled: this.areTagsAsNumbers }"
                data-e2e-type="editor-segment-toggle-tags-btn"
                :disabled="!isActive || isRequestCompleted"
                title="Toggle tags"
                @click="toggleTagsAsNumbers">
              </button>
              <button
                class="confirm"
                data-e2e-type="editor-segment-confirm-btn"
                :class="{ 'status-confirmed-translator': isConfirmed }"
                :disabled="isRequestCompleted"
                :title="isConfirmed ? 'Unconfirm segment (Ctrl/Cmd + Shift + Enter)' : 'Confirm segment (Ctrl/Cmd + Enter)'"
                @click.stop="onConfirmClick">
                <status-icon :with-title="false" :status="status"/>
              </button>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="segment-content" data-e2e-type="editor-segment-columns">
          <div class="row no-gutters">
            <div class="col-auto">
              <div class="index-container">
                <span class="index">{{ segmentNumber }}</span>
              </div>
            </div>
            <div class="col">
              <div class="source-container">
                <span
                  data-e2e-type="editor-segment-source"
                  class="source"
                  :class="{'disabled': isRequestCompleted}"
                  oncut="return false;"
                  onpaste="return false;"
                  style="user-drag: none;"
                  ondragenter="return false;"
                  ondragleave="return false;"
                  ondragover="return false;"
                  ondrop="return false;"
                  ref="source"
                  @mousemove="handleMove($event)"
                  @mouseleave="handleMouseLeave"
                  v-html="sourceTextDisplayed"
                  v-on="sourceEventListeners"
                  :contenteditable="!isRequestCompleted"></span>
                  <popover :showPopover="showPopover" data-e2e-type="popover">
                    <template>
                      <div v-html="popoverContent"></div>
                    </template>
                  </popover>
              </div>
            </div>
            <div class="col-auto">
              <div class="translation-info-container">
                <div class="translation-info">
                  <i class="fas fa-lock" v-if="isLocked" data-e2e-type="editor-segment-locked"></i>
                  <span class="match" v-if="isMatched" data-e2e-type="editor-segment-match">{{ matchScore }}%</span>
                  <span class="type type-mt" v-if="isMT" data-e2e-type="editor-segment-origin-mt">MT</span>
                  <span class="type type-ht" v-else-if="isHT" data-e2e-type="editor-segment-origin-ht">HT</span>
                  <span class="type type-rt mt-1" v-if="isRepetitive" data-e2e-type="editor-segment-rt">RP</span>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="target-container">
                <div class="row">
                  <div class="col-12">
                    <span
                      class="target"
                      :class="{'disabled': isDisabled}"
                      data-e2e-type="editor-segment-target"
                      :contenteditable="!isDisabled"
                      v-on="targetEventListeners"
                      ref="target"></span>
                    <div ref="availableTagsDiv" class="available-tags" v-if="areAvailableTagsShown">
                      <tags-list :tags="availableTargetTags" :formatFn="formatTag" @tag-picked="handleTagPicked($event, 'target')"/>
                    </div>
                    <suggestion-dropdown-mounter
                      v-if="useMt && isSuggestionsDropdownOpen"
                      :source="sourceText"
                      :prefix="suggestionsPrefix"
                      :suggestion-models="suggestionModels"
                      :coords="caretCoords"
                      :settings="{ sourceLanguage: suggestionsSourceLanguage, targetLanguage: suggestionsTargetLanguage }"
                      @input="suggestionInput"
                      @close="onSuggestionDropdownClose"
                      render-id="suggestion-dropdown"
                    />
                  </div>
                  <div class="col-auto ml-auto">
                    <i v-show="isLoading" data-e2e-type="editor-segment-loader" class="fas fa-spinner in-progress"></i>
                    <button
                      class="fas fa-plus"
                      data-e2e-type="editor-segment-add-tag-btn"
                      :disabled="!isActive || isLocked || isRequestCompleted"
                      title="Add User Tag"
                      @mousedown.prevent=""
                      @click="onAddUserTag">
                    </button>
                    <button
                      class="fas fa-code" :disabled="!isActive || isRequestCompleted"
                      :class="{ toggled: this.areTagsAsNumbers }"
                      title="Toggle tags"
                      data-e2e-type="editor-segment-toggle-tags-btn"
                      @click="toggleTagsAsNumbers">
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-auto">
              <div class="confirm-container">
                <button
                  class="btn btn-secondary confirm"
                  data-e2e-type="editor-segment-confirm-btn"
                  :disabled="!canUpdate"
                  :class="{ 'status-confirmed-translator': isConfirmed }"
                  :title="isConfirmed ? 'Unconfirm segment (Ctrl/Cmd + Shift + Enter)' : 'Confirm segment (Ctrl/Cmd + Enter)'"
                  @click.stop="onConfirmClick">
                  <status-icon :with-title="false" :status="status"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div class="validation-container d-flex" v-if="qaIssues && qaIssues.length" data-e2e-type="validation-container">
        <div class="d-flex mr-3 flex-wrap">
          <div
            v-for="(qaIssue, index) of qaIssues"
            :key="qaIssue.locQualityIssueComment + qaIssue.locQualityIssueEnabled + index"
            class="validation" :style="{ color: getQaIssueColor(qaIssue) }"
            data-e2e-type="editor-segment-qa-issue">
            <input
              type="checkbox"
              :checked="qaIssue.locQualityIssueEnabled === 'no'"
              @click="onQaIssueIgnoreChange($event, index)"
              data-e2e-type="editor-segment-qa-issue-validation-checkbox">
            {{ qaIssue.locQualityIssueComment }}
          </div>
        </div>
        <div class="ignore-container">
          <input
            type="checkbox"
            v-model="areAllQaIssuesIgnored"
            data-e2e-type="editor-segment-qa-issue-ignore-all-checkbox">
          Ignore all
        </div>
      </div>
      <div class="filename-container" v-if="isRepetitionsFilterOn" data-e2e-type="segment-filename">
        <p class="m-0">{{ fileName }}</p>
      </div>
    </div>
  </div>
</template>

<script src="./editor-segment.js"></script>
<style lang="scss" src="./editor-segment.scss"></style>
