<template>
  <div class="pts-grid-edit-modal document-type-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div>
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Name</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit" :class="{'has-danger': !isValid || errors.has('name')}">
            <input name="name" type="text" autofocus class="form-control" data-e2e-type="document-type-name" v-model.trim="documentType.name">
            <div class="form-control-feedback" v-show="errors.has('name')">Document type name is required.</div>
          </div>
          <div data-e2e-type="document-type-name-readonly" v-else>{{ documentType.name }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Extensions</div>
          <div class="col-12 col-md-10" v-if="canCreateOrEdit">
            <input name="name" type="text" class="form-control" data-e2e-type="document-type-extensions" v-model.trim="documentType.extensions">
          </div>
          <div data-e2e-type="document-type-extensions-readonly" v-else>{{ documentType.extensions }}</div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew">
          <div class="col-11 col-md-2">Inactive</div>
          <div class="col-1 col-md-10">
            <input
              type="checkbox"
              class="form-control pts-clickable"
              :disabled="!canCreateOrEdit"
              data-e2e-type="document-type-inactive-checkbox"
              v-model="documentType.deleted"
              value="true">
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button
        data-e2e-type="document-type-save"
        class="btn btn-primary pull-right mr-2"
        :disabled="!isValid"
        @click="save"
        v-if="canCreateOrEdit"
      >Save</button>
    </div>
  </div>
</template>

<script src="./document-type-edit.js"></script>
