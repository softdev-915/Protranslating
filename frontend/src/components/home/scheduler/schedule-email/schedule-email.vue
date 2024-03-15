<template>
  <div class="container-fluid">
    <div class="row align-items-center">
      <div class="col-12 col-md-2">From</div>
      <div class="col-12 col-md-10 pts-grid-edit-text" :class="{'has-danger': !isValidEmailFrom}">
        <pts-email-input v-model="from" cssClass="form-control" invalidClass="form-control-danger" @email-validation="onEmailValidation($event)"></pts-email-input>
        <!-- <input type="text" class="form-control" :class="{'form-control-danger': !isValidEmailFrom}" v-model.trim="from"> -->
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col-12 col-md-2">Subject</div>
      <div class="col-12 col-md-10 pts-grid-edit-text" :class="{'has-danger': !isValidSubject}">
        <input
          type="text"
          class="form-control"
          :class="{'form-control-danger': !isValidSubject}"
          v-model.trim="subject"
          data-e2e-type="scheduler-subject-input">
      </div>
    </div>
    <div class="row align-items-center p-0">
      <div class="col-12" data-e2e-type="scheduler-template-editor">
        <template-editor :variables="variables" :subject="subject" @template-sanitizing="onTemplateSanitizing" @template-error="onTemplateError($event)" v-model="template"></template-editor>
      </div>
    </div>
  </div>
</template>

<script src="./schedule-email.js"></script>
