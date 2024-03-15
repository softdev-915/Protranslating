<template>
  <div class="pts-grid-edit-modal notification-advanced-settings-modal" :class="{ 'blur-loading-row': loading }">
    <div v-show="!backupsAvailable">
      <p>There are no backups available to restore.</p>
    </div>
    <div v-show="backupsAvailable && restoreExecuted">
      <div slot="default">
        <div id="auditDetailForm" class="container-fluid" data-e2e-type="notification-restore-backup-form">
          <div class="row form-section">
            <div class="col-12 pts-font-bold">Restore details</div>
          </div>
          <div class="row form-section" v-show="restoring">
            <div class="col-12">
              <p>
                Restoring backup from {{dateFrom}}.
              </p>
              <p>This operation could take a few minutes.</p>
              <p>Please wait...</p>
            </div>
          </div>
          <div class="row form-section" v-show="!restoring">
            <div class="col-12">
              <p>
                Restoring backup from {{dateFrom}}.
              </p>
              <p v-show="restoreExecutedSuccess === 'success'">Operation success!!</p>
              <p  v-show="restoreExecutedSuccess === 'errored'">An error ocurred during the restore process</p>
              <ul>
                <li v-for="log in restoreExecutedDetail">
                  <b>{{log.folder}}</b>
                  ( Status: {{log.status}} ) -
                  {{log.desc}}
                  <span v-show="log.error">{{(log.error && log.error.errmsg) ? log.error.errmsg : ''}}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-show="backupsAvailable && !restoreExecuted">
      <div slot="default">
        <div id="auditDetailForm" class="container-fluid">
          <div class="row form-section">
            <div class="col-12 pts-font-bold">Restore details</div>
          </div>
          <div class="row form-section">
            <!-- Restore details -->
            <div class="col-12">
              <div class="row">
                <label class="col-md-12">From</label>
                <div class="form-group col-md-3">
                  <simple-basic-select
                    data-e2e-type="from-year-select"
                    :options="years"
                    :empty-option="selectEmptyOption"
                    v-model="fromYear" />
                </div>
                <div class="form-group col-md-3" v-if="isYearSelected">
                  <simple-basic-select
                    data-e2e-type="from-month-select"
                    :options="months"
                    :format-option="option => option"
                    :empty-option="selectEmptyOption"
                    v-model="fromMonth" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions" v-show="!loading">
      <button
        v-show="!restoreExecuted"
        id="restore-backups"
        data-e2e-type="notification-restore-backup-button"
        class="btn btn-primary pull-right mr-2" @click="runRestore"
        :disabled="!areYearMonthSet || restoring || !backupsAvailable">
        Restore Backup
        <i v-show="restoring" class="fas fa-spinner fa-pulse fa-fw" />
      </button>
    </div>
  </div>
</template>

<script src="./notification-advanced-settings.js"></script>

