<template>
  <div class="portalcat-actions-ui-set ui-set">
    <dockbar
      @restore-layout="restoreLayout"
      @switch-layout="onSwitchLayout"
      @save-workbench="onSaveWorkbench"
      @keyboard-shortcuts="$emit('keyboard-shortcuts')"
      @input="onConfigChange"
      :value="setConfig">
    </dockbar>
    <main-content
      @input="onConfigChange"
      @action-config="$emit('action-config', $event)"
      @lock-segments="$emit('lock-segments')"
      :value="setConfig"
      :defaultConfig="defaultConfig">
    </main-content>
    <progress-bar></progress-bar>
  </div>
</template>

<script src="./actions-set.js"></script>