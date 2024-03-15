<template>
  <div class="editor-container" data-e2e-type="basic-cat-tool-editor-container">
    <rich-text-editor v-model="translation.translation" :disabled="!translation._id " @change="startTimeout"></rich-text-editor>
  </div>
</template>

<script src="./basic-cat-tool-editor.js"></script>
<style lang="scss" scoped src="./basic-cat-tool-editor.scss"></style>
