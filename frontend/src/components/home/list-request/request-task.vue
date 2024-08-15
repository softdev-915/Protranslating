<template>
  <div>
    <div class="row">
      <label for="internalCommentsContainer" class="col-12 form-check-label pts-font-bold">
        Internal comments
      </label>
    </div>
    <div class="row">
      <div class="col-12">
        <div class="container-fluid pts-no-padding" data-e2e-type="internalCommentsContainer" :class="{'has-danger': !isValidCommentsLength}">
          <div class="editor-container">
            <rich-text-editor :disabled="disabled" id="internalCommentsContainer" v-model.trim="request.internalComments" placeholder="Internal Comments"></rich-text-editor>
          </div>
          <span class="form-control-feedback" v-show="!isValidCommentsLength">Maximum comment length is {{ maxCommentsLength }} characters</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./request-task.js"></script>
