<template>
  <div class="pts-grid-edit-modal toast-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">Title</label>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canCreate">
            <input type="text" data-e2e-type="header-notification-title" id="title" name="title" class="form-control" :class="{'form-control-danger': errors.has('name')}" v-model="toast.title" v-validate="'required'">
            <div class="form-control-feedback" v-show="errors.has('name')">Header Notification title is required.</div>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-else>
            {{toast.title}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">Message</label>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('message')}" v-if="canCreate">
            <textarea id="message" data-e2e-type="header-notification-message" name="message" class="form-control" :class="{'form-control-danger': errors.has('message')}" v-model="toast.message" v-validate="'required'"></textarea>
            <div class="form-control-feedback" v-show="errors.has('message')">Header Notification message is required.</div>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('message')}" v-else>
            {{toast.message}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="name">State</label>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('name')}" v-if="canCreate" data-e2e-type="header-notification-state">
            <simple-basic-select
              id="name"
              v-model="toast.state"
              class="form-control non-focusable"
              :class="stateClass"
              :options="toastClassesList"/>
          </div>
          <div class="col-12 col-md-10" :class="{'has-danger': errors.has('message')}" v-else>
            {{toast.message}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="context">Users</label>
          </div>
          <div class="col-12 col-md-10" v-if="canCreate" data-e2e-type="header-notification-user-select">
            <user-select :multi="true" :allow-all="true" v-model="users"></user-select>
          </div>
          <div class="col-12 col-md-10" v-else>
            {{toastUsersName}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="from">From</label>
          </div>
          <div class="col-12 col-md-10 toast-edit-time-selector" v-if="canCreate">
            <utc-flatpickr data-e2e-type="header-notification-from" :config="fromDatepickerOptions" class="form-control" v-model="toast.from"></utc-flatpickr>
          </div>
          <div class="col-12 col-md-10" v-else>
            <local-date :value="toast.from"></local-date>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="to">To</label>
          </div>
          <div class="col-12 col-md-10 toast-edit-time-selector" v-if="canCreate">
            <utc-flatpickr data-e2e-type="header-notification-to" :config="toDatepickerOptions" class="form-control" :value="toast.to" @input="onToastChange"></utc-flatpickr>
          </div>
          <div class="col-12 col-md-10" v-else>
            <local-date :value="toast.to"></local-date>
          </div>
        </div>
        <!-- uncomment when context is available -->
        <!-- <div class="row align-items-center">
          <div class="col-12 col-md-2">
            <label for="context">Context</label>
          </div>
          <div class="col-12 col-md-10">
            <variable-reference :vars="toastContext"></variable-reference>
          </div>
        </div> -->
        <div class="row align-items-center checkbox-container">
          <div class="col-11 col-md-2">
            <label for="requireDismiss">Require dismiss</label>
          </div>
          <div class="col-1 col-md-10" v-if="canCreate">
            <input data-e2e-type="header-notification-require-dismiss" id="requireDismiss" type="checkbox" class="form-control pts-clickable" v-model="toast.requireDismiss" value="true">
          </div>
          <div class="col-12 col-md-10" v-else>
            {{toast.requireDismiss}}
          </div>
        </div>
        <div class="row align-items-center checkbox-container" v-show="canCreate && toast._id">
          <div class="col-11 col-md-2">
            <label id="deleted">Deleted</label>
          </div>
          <div class="col-1 col-md-10">
            <input data-e2e-type="header-notification-deleted" for="deleted" type="checkbox" class="form-control pts-clickable" v-model="toast.deleted" value="true">
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button data-e2e-type="header-notification-save" class="btn btn-primary pull-right mr-2" v-show="!httpRequesting" :disabled="!isValid" @click="save" v-if="canCreate">Save</button>
      <button data-e2e-type="header-notification-simulate" class="btn btn-info pull-right mr-2" v-show="!httpRequesting" :disabled="!isValid" @click="validateAndSimulate" v-if="canCreate">Simulate</button>
    </div>
  </div>
</template>

<style lang="scss" src="./toast-edit_global.scss"></style>

<script src="./toast-edit.js"></script>
