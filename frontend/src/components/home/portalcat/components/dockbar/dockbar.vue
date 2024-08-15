<template>
  <div class="portalcat-dockbar" data-e2e-type="portalcat-dockbar">
    <div class="row align-items-center">
      <div class="dockbar-actions col-12 col-lg-auto">
        <button
          class="btn btn-secondary btn-sm"
          title="Memory Editor"
          :disabled="!canEnterMemoryEditor"
          @click="navigateToMemoryEditor"
          data-e2e-type="portalcat-dockbar-memory-editor">
          <i class="fas fa-book"></i>
        </button>
        <button
          class="btn btn-secondary btn-sm"
          title="Save Workbench"
          @click="$emit('save-workbench')"
          data-e2e-type="portalcat-dockbar-save-workbench">
          <i class="fas fa-save"></i>
        </button>
        <button
          class="btn btn-secondary btn-sm"
          title="Keyboard Shortcuts"
          @click="$emit('keyboard-shortcuts')"
          data-e2e-type="portalcat-dockbar-shortcuts">
          <i class="fas fa-keyboard"></i>
        </button>
      </div>
      <div class="dockbar-title col-12 col-lg">
        <p
          class="mb-0 font-weight-bold text-center"
          data-e2e-type="portalcat-dockbar-taskinfo">
          Request: {{ requestTitle }} | Task: {{ taskName }} | {{ sourceLanguage }} - {{ targetLanguage }}
        </p>
      </div>
      <div class="dockbar-actions col-12 col-lg-auto">
        <button
          :disabled="isPipelineInProgress"
          class="btn btn-secondary btn-sm"
          title="Restore Default Layout"
          @click="$emit('restore-layout')"
          data-e2e-type="portalcat-dockbar-restore">
          <i class="fas fa-window-restore"></i>
        </button>
        <button
          :disabled="isPipelineInProgress"
          class="btn btn-secondary btn-sm"
          title="Switch Layout"
          @click="$emit('switch-layout')"
          data-e2e-type="portalcat-dockbar-switch">
          <i class="fas fa-columns"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./dockbar.js"></script>
<style lang="scss" src="./dockbar.scss" scoped></style>