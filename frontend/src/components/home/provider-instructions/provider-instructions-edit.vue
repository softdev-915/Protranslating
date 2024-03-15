<template>
  <div class="pts-grid-edit-modal provider-instructions-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-1" data-e2e-type="provider-instructions-name-label">Name<span class="pts-required-field">*</span></div>
          <div class="col-12 col-md-11" v-if="canCreateOrEdit"  :class="{'has-danger': !isNameValid}">
            <input type="text" v-validate="'required'" name="name" autofocus class="form-control" data-e2e-type="provider-instructions-name" v-model.trim="providerInstructions.name">
          </div>
          <div v-else>{{ providerInstructions.name }}</div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-1" data-e2e-type="provider-instructions-body-label">Body<span class="pts-required-field">*</span></div>
          <div class="col-12 col-md-11" :class="{'has-danger': !isBodyValid}" v-if="canCreateOrEdit">
            <textarea
              data-e2e-type="provider-instructions-body"
              class="form-control"
              v-model="providerInstructions.body"
              @input="onBodyChange"
              placeholder="Limit 5000 characters"
              name="body"
              v-validate="'required'"
              rows="20"
              />
          </div>
          <div v-else data-e2e-type="provider-instructions-days-read-only">
            {{ providerInstructions.body }}
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="!isNew && canEdit">
          <div class="col-11 col-md-1">
            <label for="provider-instructions-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-11">
            <input type="checkbox" class="form-control pts-clickable" v-model="providerInstructions.deleted" value="true" data-e2e-type="provider-instructions-inactive-checkbox" id="provider-instructions-inactive">
          </div>
        </div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary pull-right" @click="cancel">{{cancelText}}</button>
      <button data-e2e-type="provider-instructions-save" class="btn btn-primary pull-right mr-2" :disabled="!isValid" @click="save" v-if="canCreateOrEdit">Save</button>
    </div>
  </div>
</template>

<script src="./provider-instructions-edit.js"></script>
