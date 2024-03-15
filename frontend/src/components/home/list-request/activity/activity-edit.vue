<template>
  <div class="pts-grid-edit-modal activity-inline-edit" :class="{'blur-loading-row': httpRequesting || sendingQuote }">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center" v-if="!isNew">
          <div class="col-12 col-md-2">
            <label for="activity-id">Activity Id</label>
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
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Date Sent</div>
          <div class="col-12 col-md-10" data-e2e-type="activity-date-sent">
            {{ dateSent | localDateTime('YYYY-MM-DD HH:mm') }}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Type</div>
          <div class="col-12 col-md-8" v-if="canCreate || canEdit" :class="{'has-danger': !isValidActivityType}">
            <activity-type-selector
              v-model="activity.activityType"
              :disabled="true"
              data-e2e-type="typeSelector">
            </activity-type-selector>
            <div class="form-control-feedback" v-show="!isValidActivityType">Activity type must be selected.</div>
          </div>
          <div class="col-12 col-md-8" :class="{'has-danger': !isValidActivityType}" v-else>
            {{activity.activityType}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Created By</div>
          <div class="col-12 col-md-10">
            <input
              type="text"
              class="form-control"
              readonly
              :value="activity.activityCreatedBy"
              data-e2e-type="activity-created-by">
          </div>
        </div>
        <activity-email-details v-if="getActivityType === 'Email'"
          v-model="activity"
          :documentUrlResolver="emailActivityUrlResolver"
          @validate-activity-email="onEmailDetailsValidate">
        </activity-email-details>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions mt-2">
      <button class="btn btn-secondary pull-right" @click="close">Close</button>
      <span class="pull-right mr-2" v-show="httpRequesting"><i class="fas fa-spin fa-circle-o-notch"></i></span>
      <button
        data-e2e-type="activity-save"
        class="btn btn-primary pull-right mr-2"
        v-show="!httpRequesting"
        :disabled="!isValid"
        @click="save"
        v-if="canCreate || canEdit">
        Save
      </button>
      <button
        data-e2e-type="activity-send-quote"
        class="btn btn-primary pull-right mr-2"
        v-show="!httpRequesting"
        :disabled="!isValid"
        @click="sendQuote"
        v-if="canCreate || canEdit">
        {{sendButtonText}}
      </button>
    </div>
  </div>
</template>

<script src="./activity-edit.js"></script>
