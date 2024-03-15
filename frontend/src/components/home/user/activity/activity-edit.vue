<template>
  <div class="pts-grid-edit-modal activity-inline-edit" :class="{'blur-loading-row': httpRequesting}">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center" v-if="!isNew">
          <div class="col-12 col-md-2">
            <label for="activity-id">ActivityID</label>
          </div>
          <div class="col-6 col-md-3">
            <input
              type="text"
              name="_id"
              disabled="true"
              class="form-control"
              v-model="activity._id"
              id="activity-id"
              data-e2e-type="activityId"/>
           </div>
         </div>
        <div class="row align-items-center" v-if="!isNew">
          <div class="col-12 col-md-2">Date Sent</div>
          <div class="col-12 col-md-10" data-e2e-type="activity-date-sent">
            {{ localDateSent }}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2"><span class="pts-required-field">* </span>Type</div>
          <div class="col-12 col-md-8" v-if="canCreateOrEdit" :class="{'has-danger': !isValidActivityType}">
            <activity-type-selector
              v-model="activity.activityType"
              :disabled="isTypeSelectDisabled"
              data-e2e-type="typeSelector">
            </activity-type-selector>
            <div class="form-control-feedback" v-show="!isValidActivityType">Activity type must be selected.</div>
          </div>
          <div class="col-12 col-md-8" :class="{'has-danger': !isValidActivityType}" v-else>
            {{activity.activityType}}
          </div>
        </div>
        <div class="row align-items-center" v-show="usersMustBeShown">
          <div class="col-12 col-md-2"><span class="pts-required-field">* </span>Users </div>
          <div class="col-8 col-md-8" :class="{'has-danger': !isValidUsers}">
            <user-ajax-multi-select
              :show-missing-options="true"
              title="Users"
              id="userSelector"
              :isDisabled="!canCreateOrEdit || !isNew"
              :selected-options="selectedUsers"
              :filter="{ terminated: false }"
              :selectedOptionsClickable="true"
              @select="onUserSelected"
              @selected-option-clicked="navigateUserGrid"
              data-e2e-type="userSelector">
            </user-ajax-multi-select>
            <div class="form-control-feedback" v-show="!isValidUsers">Select at least one User.</div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Created By</div>
          <div class="col-12 col-md-8">
            <input
              type="text"
              class="form-control"
              readonly
              :value="activity.activityCreatedBy"
              data-e2e-type="activity-created-by"
            >
          </div>
        </div>
        <activity-user-note-details v-if="getActivityType === 'User Note'"
          v-model="activity"
          @validate-activity-user-note="onUserNoteDetailsValidate"
          @manage-activity-tag="manageTags">
        </activity-user-note-details>
        <activity-feedback-details v-if="getActivityType === 'Feedback'"
          v-model="activity"
          @validate-activity-feedback="onFeedbackDetailsValidate"
          @upload-file="uploadFile"
          @manage-activity-tag="manageTags"
          @documents-updated="onDocumentsUpdate">
        </activity-feedback-details>
        <activity-email-details v-if="getActivityType === 'Email'"
          v-model="activity"
          :emlUpload="parsedEml"
          :documentUrlResolver="emailActivityUrlResolver"
          @user-manage="onUserManage"
          @validate-activity-email="onEmailDetailsValidate">
        </activity-email-details>
        <div class="row align-items-center checkbox-container" v-show="canOnlyEdit">
          <div class="col-11 col-md-2">
            <label for="activity-inactive">Inactive</label>
          </div>
          <div class="col-1 col-md-3">
            <input
              type="checkbox"
              class="form-control pts-clickable"
              v-model="activity.deleted"
              id="activity-inactive"
              data-e2e-type="activity-inactive"/>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button data-e2e-type="activity-save" class="btn btn-primary pull-right mr-2" v-show="!httpRequesting" :disabled="!isValid" @click="validateBeforeSubmit" v-if="canCreateOrEdit">Save</button>
      <button data-e2e-type="activity-send-email" class="btn btn-primary pull-right mr-2" @click="sendInvoiceEmail" v-if="canSendEmail">{{sendEmailBtnText}}</button>
    </div>
  </div>
</template>

<script src="./activity-edit.js"></script>
