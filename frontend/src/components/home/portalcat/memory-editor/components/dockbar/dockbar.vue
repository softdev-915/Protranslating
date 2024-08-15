<template>
  <div class="memory-editor-dockbar" data-e2e-type="memory-editor-dockbar">
    <div class="row align-items-center">
      <div class="dockbar-actions col-12 col-lg-auto">
        <button
          class="btn btn-secondary btn-sm"
          title="Keyboard Shortcuts"
          @click="$emit('keyboard-shortcuts')"
          data-e2e-type="memory-editor-dockbar-shortcuts">
          <i class="fas fa-keyboard"></i>
        </button>
      </div>
      <div class="dockbar-title col-12 col-lg">
        <p
          class="mb-0 font-weight-bold text-center"
          data-e2e-type="memory-editor-dockbar-taskinfo">
          Memory Editor | {{ tmName }}
        </p>
      </div>
      <div class="dockbar-actions col-12 col-lg-auto">
        <button
          class="btn btn-secondary btn-sm"
          title="Restore Default Layout"
          @click="$emit('restore-layout')"
          data-e2e-type="memory-editor-dockbar-restore">
          <i class="fas fa-window-restore"></i>
        </button>
        <button
          class="btn btn-secondary btn-sm"
          title="Switch Layout"
          @click="$emit('switch-layout')"
          data-e2e-type="memory-editor-dockbar-switch">
          <i class="fas fa-columns"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./dockbar.js"></script>
<style lang="scss" src="./dockbar.scss" scoped></style>