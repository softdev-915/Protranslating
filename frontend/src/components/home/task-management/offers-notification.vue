<template>
  <div
    class="decline-notification"
    data-e2e-type="notification-container"
    :style="{top: topPosition}"
  >
    <div
      v-for="(notification, index) in offerNotifications"
      :key="index"
      class="alert"
      :class="{
        'alert-danger': !notification.accepted,
        'alert-success': notification.accepted,
      }"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <i
        @click="removeNotification(index)"
        class="pts-clickable remove-icon hover-button fas fa-times pull-right"
      ></i>
      <i data-e2e-type="action-toast"></i>
      <strong data-e2e-type="action">
        <i
          class="fas"
          :class="{
            'fa-times-circle': !notification.accepted,
            'fa-check-circle': notification.accepted,
          }"
          aria-hidden="true"
        >
        </i>
      </strong>
      <span data-e2e-type="action-message" class="action-message">{{
        notification.message
      }}</span>
    </div>
  </div>
</template>

<script src="./offers-notification.js"></script>
<style scoped lang="scss" src="./offers-notification.scss"></style>

