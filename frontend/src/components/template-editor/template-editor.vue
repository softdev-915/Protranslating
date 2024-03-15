<template>
  <div class="container-fluid">
    <div class="row template-editor-row">
      <div class="col">
        <rich-text-editor v-model="template"></rich-text-editor>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <h6>Available variables</h6>
        <variables-reference :vars="variables"></variables-reference>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <h6>Result</h6>
        <span>
          <span class="template-subject">Subject: </span>
          <span v-if="!subjectError">{{compiledSubject}}</span>
          <span v-if="subjectError" class="template-error"><i class="fas fa-exclamation-triangle" aria-hidden="true"></i> {{subjectError.message}}</span>
        </span>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div v-if="!templateError" v-html="resolvedTemplate"></div>
        <div v-if="templateError" class="template-error">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i> {{templateError.message}}
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./template-editor.js"></script>

<style scoped lang="scss" src="./template-editor.scss"></style>
<style lang="scss" src="./template-editor-global.scss"></style>
