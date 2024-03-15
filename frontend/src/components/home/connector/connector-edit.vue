<template>
  <div
    class="pts-grid-edit-modal"
    :class="{'blur-loading-row': httpRequesting}"
    data-e2e-type="connector-edit-container">
      <div slot="default">
        <div class="container-fluid">
          <div class="row align-items-center" v-show="connector.hasAuthError">
            <div class="col-12 connector-auth-error-container">
              <span data-e2e-type="connector-auth-error">{{authErrorMessage}}</span>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="name">Connector Name</label>
            </div>
            <div
              class="col-12 col-md-10"
              data-e2e-type="connector-name">
              {{connector.name}}
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="remoteUrl">Remote URL</label>
            </div>
            <div class="col-12 col-md-10" v-if="canEdit" :class="{'has-danger': errors.has('remoteUrl')}">
              <input
                type="text"
                id="remoteUrl"
                name="remoteUrl"
                class="form-control"
                v-model="connector.remoteUrl"
                v-validate="'required'"
                data-e2e-type="connector-remote-url-input">
            </div>
            <div class="col-12 col-md-10" v-else>
              {{connector.remoteUrl}}
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="username">Username</label>
            </div>
            <div class="col-12 col-md-10" v-if="canEdit" :class="{'has-danger': errors.has('username')}">
              <input
                type="text"
                id="username"
                name="username"
                class="form-control"
                v-model="connector.username"
                v-validate="'required'"
                data-e2e-type="connector-username-input">
            </div>
            <div
              class="col-12 col-md-10"
              data-e2e-type="connector-username-read-only"
              v-else>{{connector.username}}
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="password">Password</label>
            </div>
            <div class="col-12 col-md-10" v-if="canEdit" :class="{'has-danger': errors.has('password')}">
              <input
                type="text"
                id="password"
                name="password"
                class="form-control"
                v-model="connector.password"
                v-validate="'required'"
                data-e2e-type="connector-password-input">
            </div>
            <div class="col-12 col-md-10" v-else>
              {{connector.password}}
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="senderId">Sender Id</label>
            </div>
            <div class="col-12 col-md-10" v-if="canEdit" :class="{'has-danger': errors.has('senderId')}">
              <input
                type="text"
                id="senderId"
                name="senderId"
                class="form-control"
                v-model="connector.senderId"
                v-validate="'required'"
                data-e2e-type="connector-sender-id-input">
            </div>
            <div class="col-12 col-md-10" v-else>
              {{connector.senderId}}
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="senderPassword">Sender Password</label>
            </div>
            <div class="col-12 col-md-10" v-if="canEdit" :class="{'has-danger': errors.has('senderPassword')}">
              <input
                type="text"
                id="senderPassword"
                name="senderPassword"
                class="form-control"
                v-model="connector.senderPassword"
                v-validate="'required'"
                data-e2e-type="connector-sender-password-input">
            </div>
            <div class="col-12 col-md-10" v-else>
              {{connector.senderPassword}}
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="senderId">Company Id</label>
            </div>
            <div class="col-12 col-md-10" v-if="canEdit" :class="{'has-danger': errors.has('companyId')}">
              <input
                type="text"
                id="companyId"
                name="companyId"
                class="form-control"
                v-model="connector.companyId"
                v-validate="'required'"
                data-e2e-type="connector-company-id-input">
            </div>
            <div class="col-12 col-md-10" v-else>
              {{connector.companyId}}
            </div>
          </div>
          <div class="row align-items-center checkbox-container" v-show="canEdit">
            <div class="col-11 col-md-2">
              <label for="deleted">Inactive</label>
            </div>
            <div class="col-1 col-md-10">
              <input
                id="deleted"
                type="checkbox"
                class="form-control pts-clickable"
                v-model="connector.deleted"
                data-e2e-type="connector-inactive">
            </div>
          </div>
          <div class="row align-items-center checkbox-container" v-show="canEdit">
            <div class="col-11 col-md-2">
              <label for="deleted">Instant Sync Enabled</label>
            </div>
            <div class="col-1 col-md-10">
              <input
                id="deleted"
                type="checkbox"
                class="form-control pts-clickable"
                v-model="connector.enableInstantSync">
            </div>
          </div>
          <div class="row align-items-center" v-if="canEdit">
            <div class="col-12 col-md-2">
              <label>Sync from date and time</label>
              <span class="pts-required-field">*</span>
            </div>
            <div class="col-12 col-md-4" :class="{'has-danger': !isValidSyncFromDate}">
              <utc-flatpickr
                v-model="connector.syncFromDate"
                :config="{ enableTime: true }"
                data-e2e-type="connector-sync-from-date"
                class="form-control" />
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 col-md-2">Notes</div>
            <div class="col-12 col-md-10" data-e2e-type="connector-notes-rich-text-editor">
              <rich-text-editor
                :disabled="!canEdit"
                v-model.trim="connector.notes"
                placeholder="Notes"/>
            </div>
          </div>
          <div class="row align-items-center">
            <div class="col-12 mt-1">
              <h5>Mappings</h5>
              <hr class="my-1" />
            </div>
          </div>
          <div v-for="(payload, index) in payloads" :key="index">
            <div class="row">
               <div class="col-12 col-md-2">
                <label>{{ payload }}</label>
              </div>
              <div class="col-12 col-md-4">
                <button
                  data-e2e-type="download-payload-file"
                  @click="triggerFilesDownload(payload, index)"
                  class="mr-2 pts-clickable btn">
                  <i class="fas fa-download"></i>
                </button>
                <iframe-download
                  @download-error="onIframeDownloadError($event)"
                  :ref="`iframe_doc_${index}`"
                ></iframe-download>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions">
        <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
        <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
        <button
          :disabled="!isValid"
          v-if="canEdit"
          v-show="!httpRequesting"
          @click="save"
          class="btn btn-primary pull-right mr-2"
          data-e2e-type="connector-save">Save</button>
        <button
          class="btn btn-primary pull-right mr-2"
          @click="testConnectivity"
          data-e2e-type="test-connectivity-button">Test Connectivity</button>
      </div>
  </div>
</template>

<script src="./connector-edit.js"></script>
<style lang="scss" scoped src="./connector-edit.scss" />
