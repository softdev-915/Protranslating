<template>
  <div class="pts-grid-edit-modal" :class="{'blur-loading-row': httpRequesting}">
    <div>
      <div slot="default">
        <div class="container-fluid" data-e2e-type="notification-detail-container">
          <div class="row align-items-center">
            <div class="col-12 col-md-2">
              <label for="name">Scheduled date</label>
            </div>
            <div class="col-12 col-md-10">
              {{ notification.createdAt | localDateTime('MM-DD-YYYY HH:mm') }}
            </div>

            <div class="col-12 col-md-2">
              <label for="name">Subject</label>
            </div>
            <div class="col-12 col-md-10">
              {{notification.email.subject}}
            </div>

            <div class="col-12 col-md-2">
              <label for="name">Body</label>
            </div>
            <div class="col-12 col-md-10">
              <p data-e2e-type="notification-body">{{body}}</p>
            </div>

            <div class="col-12 col-md-2">
              <label for="name">Addresses</label>
            </div>
            <div class="col-12 col-md-10">
              {{addresses}}
            </div>

            <div class="col-12 col-md-2">
              <label for="name">Sent date</label>
            </div>
            <div class="col-12 col-md-10">
              {{ notification.processed | localDateTime('MM-DD-YYYY HH:mm') }}
            </div>

            <div class="col-12 col-md-2">
              <label for="name">Email Connection</label>
            </div>
            <div class="col-12 col-md-10">
              <span data-e2e-type="notification-email-connection-string">
                {{ notification.emailConnectionString }}
              </span>
            </div>

            <div class="col-12 col-md-2">
              <label for="name">Error</label>
            </div>
            <div class="col-12 col-md-10">
              <span>{{ notification.error }} </span>
            </div>
          </div>
        </div>
      </div>
      <div slot="modal-footer" class="form-actions">
        <button class="btn btn-secondary pull-right" @click="close">Close</button>
      </div>
    </div>
  </div>
</template>

<script src="./notification-detail.js"></script>
<style scoped>
  label {
    padding: 10px 0 0 0;
    font-weight: bold;
  }
</style>
