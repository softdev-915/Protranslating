<template>
  <div class="btn-group float-right workflow-detail-buttons" role="group" aria-label="Workflow sort">
    <button
        data-e2e-type="workflow-edit-button"
        tabindex="-1"
        title="Edit workflow"
        class="fas fa-pencil"
        :class="{'pts-not-allowed': isEditDisabled}"
        :disabled="isEditDisabled"
        @click.prevent="edit"></button>
    <button
        data-e2e-type="workflow-save-button"
        tabindex="-1"
        title="Save workflow"
        class="fas fa-check"
        :class="{'pts-not-allowed': isSaveDisabled}"
        :disabled="isSaveDisabled"
        @click.prevent="save"></button>
    <button
        data-e2e-type="workflow-cancel-button"
        tabindex="-1"
        title="Cancel workflow changes"
        class="fas fa-close"
        :class="{'pts-not-allowed': isCancelDisabled}"
        :disabled="isCancelDisabled"
        @click.prevent="cancel"></button>
    <div v-show="showMoveBtn">
      <button
          data-e2e-type="workflow-move-up-button"
          tabindex="-1"
          title="Move workflow up"
          class="fas fa-arrow-up"
          :class="{'pts-not-allowed': isMoveDisabled}"
          :disabled="isMoveDisabled"
          @click.prevent="move(-1)"></button>
      <button
          data-e2e-type="workflow-move-down-button"
          tabindex="-1"
          title="Move workflow down"
          class="fas fa-arrow-down"
          :class="{'pts-not-allowed': isMoveDisabled}"
          :disabled="isMoveDisabled"
          @click.prevent="move(1)"></button>
    </div>
  </div>
</template>

<script src="./workflow-detail-buttons.js"></script>
