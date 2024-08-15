<template>
  <div class="pts-grid-edit-modal" :class="{'blur-loading-row': httpRequesting || loading}" data-e2e-type="scheduler-edit-body">
    <div slot="default">
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Name</div>
          <div class="col-12 col-md-10" data-e2e-type="scheduler-name">
            {{scheduler.name}}
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Every</div>
          <div class="col-12 col-md-10 pts-grid-edit-text" :class="{'has-danger': !isValidEvery}">
            <input data-e2e-type="schedulerEvery" type="text" class="form-control" :class="{'form-control-danger': !isValidEvery}" v-model.trim="scheduler.every">
          </div>
        </div>
        <div class="row align-items-center"  v-show="showDelayField">
          <div class="col-12 col-md-2">Delay Notifications(minutes)</div>
          <div class="col-12 col-md-10 pts-grid-edit-text" :class="{'has-danger': !isValidNotificationDelay}">
            <input data-e2e-type="scheduler-notification-delay-input" type="text" class="form-control" v-model.number="scheduler.options.notificationDelay">
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Schedule on</div>
          <div class="col-12 col-md-10 pts-grid-edit-text">
            <div class="input-group" :class="{'has-danger': !isValidSchedule}" data-e2e-type="scheduler-date-input">
              <utc-flatpickr v-model="scheduler.schedule" :format="'YYYY-MM-DD HH:mm'" :config="datepickerOptions" class="form-control" :class="{'form-control-danger': !isValidSchedule}"></utc-flatpickr>
              <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
            </div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Lock lifetime</div>
          <div class="col-12 col-md-10 pts-grid-edit-text">
            <div class="input-group" :class="{'has-danger': !isValidLockLifetime}">
              <input type="text" class="form-control" v-model.number="scheduler.options.lockLifetime">
            </div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Lock limit</div>
          <div class="col-12 col-md-10 pts-grid-edit-text">
            <div class="input-group" :class="{'has-danger': !isValidLockLimit}">
              <input type="text" class="form-control" v-model.number="scheduler.options.lockLimit">
            </div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Concurrency</div>
          <div class="col-12 col-md-10 pts-grid-edit-text">
            <div class="input-group" :class="{'has-danger': !isValidConcurrency}">
              <input type="text" class="form-control" v-model.number="scheduler.options.concurrency">
            </div>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-2">Priority</div>
          <div class="col-12 col-md-10 pts-grid-edit-text">
            <simple-basic-select
              v-model="selectedPriority"
              class="form-control non-focusable col-12 col-md-10"
              :options="prioritiesList"/>
          </div>
        </div>
      </div>
      <schedule-email :value="scheduler.email" @template-sanitizing="onSanitizingTemplate" @input="onEmailChange($event)" @template-error="onTemplateError($event)" v-if="scheduler.email"></schedule-email>
      <div class="row">
        <div class="col">
          <dynamic-fields v-model="scheduler.options"></dynamic-fields>
        </div>
      </div>
      <scheduler-entity-modal
        :scheduler-name="scheduler.name"
        v-if="shouldSelectEntityToSync && scheduler.name"
        :show-modal="showModal"
        @on-modal-show="onModalShow()"
        @on-modal-hide="onModalHide()"
        @on-run-now="runNow"
        @on-option-select="onEntitySelect"
        @on-populate-mocked-entity-si-payload="getMockedEntitySIPayload"
      />
      <div class="container-fluid">
        <div class="row align-items-center checkbox-container" v-show="canEdit">
          <div class="col-11 col-md-2 pl-3">
            <label for="inactive">
              <label for="scheduler-inactive">Inactive</label>
            </label>
          </div>
          <div class="col-1 col-md-10">
            <input type="checkbox" data-e2e-type="inactive-checkbox" class="form-control pts-clickable" v-model="scheduler.deleted" value="true">
          </div>
        </div>
      </div>
    </div>
    <div class="row">
        <div class="col">
          <small class="pts-clickable p-3 history-show" data-e2e-type="show-execution-history" @click="showExecutionHistory = true" v-show="!showExecutionHistory">Show execution history</small>
          <div class="container" v-show="showExecutionHistory">
            <h6 v-show="showExecutionHistory">Execution history</h6>
            <div class="row" v-for="h in scheduler.executionHistory" :key="h.executed" data-e2e-type="scheduler-execution-history">
              <div data-e2e-type="scheduler-execution-history-date" class="col-4"><local-date :value="h.executed" format="YYYY-MM-DD HH:mm:ss"></local-date></div>
              <div class="col-4">{{h.status}}</div>
              <div class="col-4">{{h.error}}</div>
            </div>
          </div>
        </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <div v-if="canShowMockedEntityPayload" class="row mt-4">
        <div class="col-12 px-4">
          <h5>Mocked entity SI payload</h5>
          <hr class="my-1 mb-2"/>
          <textarea
            rows="30"
            style="height:100%;"
            class="form-control"
            data-e2e-type="mocked-entity-si-payload"
            readonly
            v-model="mockedEntitySIPayload"
          ></textarea>
        </div>
      </div>
      <div class="row mt-5">
        <div class="col-12 mt-3">
          <button class="btn btn-secondary pull-right" @click="close">{{cancelText}}</button>
          <button class="btn btn-primary pull-right mr-2"  :disabled="!isValid || sanitizingTemplate" @click="save" v-if="canEdit" data-e2e-type="scheduler-save-button">Save</button>
          <button class="btn btn-primary pull-right mr-2"  @click="runNow" data-e2e-type="scheduler-execute-button">Execute</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./scheduler-edit.js"></script>
<style lang="scss" src="./scheduler-edit.scss"></style>

