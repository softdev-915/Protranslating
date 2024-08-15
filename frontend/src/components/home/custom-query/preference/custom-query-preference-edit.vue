<template>
  <div :class="{ 'blur-loading-row': httpRequesting }">
    <div slot="default">
      <div class="container-fluid">
        <div v-show="customQueryIdError !== ''" class="row">
          <div class="col-12 has-danger">
            <span class="form-control-feedback">{{ customQueryIdError }}</span>
          </div>
        </div>
        <div class="row align-items-center">
          <div class="col-12 col-md-3">
            <label for="custom-query-preference-input-scheduled-at">Scheduled at</label>
          </div>
          <div
            class="col-12 col-md-9 mb-2"
            :class="{ 'has-danger': errors.has('scheduledAt') }"
            data-e2e-type="custom-query-preference-scheduled-at-block">
            <input
              id="custom-query-preference-input-scheduled-at"
              v-model.trim="customQueryPreference.scheduledAt"
              class="form-control"
              name="scheduledAt"
              placeholder="* * * * *"
              v-validate="'cron-validator'"
              data-e2e-type="custom-query-preference-scheduled-at">
            <span class="form-control-feedback">{{
                errors.first('scheduledAt') || scheduledAtText
              }}</span>
          </div>
          <div class="col-12 mb-2">
            <div class="card">
              <div class="card-header">
                <a
                  href="javascript:"
                  data-e2e-type="custom-query-toggle-preferences"
                  @click="showHelp = !showHelp">
                  <i class="fas fa-info-circle"></i>&nbsp;Help
                </a>
              </div>
              <div class="collapse" :class="{ show: showHelp }">
                <div class="card-block">
                  <pre>
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of the month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
│ │ │ │ │                   * means "any value"
│ │ │ │ │
│ │ │ │ │
* * * * *
Examples:
15 14 1 * * - At 14:15 on each first day of month.
5 0 * 8 * - At 00:05 every day in August.
0 14 * * * - At 14:00 every day.
* 20 * * * - At 20 o'clock every minute.
0 10 * * 1 - At 10:00 on every Monday.
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions">
      <button
        v-if="canEdit"
        :disabled="!isValid"
        data-e2e-type="custom-query-preference-save"
        class="btn btn-primary"
        @click="save">
        Save preferences
      </button>
    </div>
  </div>
</template>

<script src="./custom-query-preference-edit.js"></script>
