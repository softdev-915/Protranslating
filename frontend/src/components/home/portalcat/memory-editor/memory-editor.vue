<template>
  <div class="memory-editor" data-e2e-type="memory-editor-body" :class="{ 'blur-loading-row': isLoading }">
    <dockbar @restore-layout="restoreLayout" @switch-layout="switchLayout"/>
    <main-content
      v-model="setConfig"
      :defaultConfig="defaultConfig">
    </main-content>
    <progress-bar/>
  </div>
</template>

<script src="./memory-editor.js"></script>
<style src="./memory-editor.scss" lang="scss"></style>