<template>
  <div class="menubar memory-editor-segment-actions">
    <div class="menubar-group">
      <button
        :disabled="!canCreate || isSegmentCreationInProgress"
        @click="$emit('add')"
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        data-e2e-type="editor-segment-add-btn">
        <i v-if="isSegmentCreationInProgress" class="fas fa-spinner in-progress"></i>
        <i v-else class="fas fa-plus"></i>
      </button>
      <button
        :disabled="!canDelete || !activeSegment || isSegmentDeletionInProgress"
        @click="$emit('delete')"
        type="button"
        class="btn btn-small btn-icon btn-secondary"
        data-e2e-type="editor-segment-remove-btn">
        <i v-if="isSegmentDeletionInProgress" class="fas fa-spinner in-progress"></i>
        <i v-else class="fas fa-trash"></i>
      </button>
    </div>
  </div>
</template>

<script src="./editor-segment-actions.js"></script>
