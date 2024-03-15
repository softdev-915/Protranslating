<template>
  <div class="notification-container" data-e2e-type="notification-container">
    <div
      v-for="(n, index) in notifications"
      :key="index"
      :class="getNotificationClass(n)"
      role="alert"
      aria-live="polite"
      aria-atomic="true">
      <i @click="removeNotification(n)" class="pts-clickable remove-notification-icon fas fa-times pull-right"></i>
      <template v-if="notifications[index]._id">
        <i data-e2e-type="user-toast"></i>
      </template>
      <template v-else>
        <i data-e2e-type="action-toast"></i>
      </template>
      <strong data-e2e-type="action">{{n.title}}</strong> <span data-e2e-type="action-message" class="action-message">{{n.message}}</span>
      <span data-e2e-type="action" v-show="n.html" v-html="n.html" @click="onNotificationHtmlClick(n)"></span>
      <button v-show="shouldShowStack(n) && !n.isShowStack" class="error-detail-btn btn btn-primary pull-right" @click="showStack($event, n)">Click To See Error Details</button>
      <div class="stack-trace" :style="n.isShowStack ? {'display': 'block'} : {'display': 'none'}">
        <p data-e2e-type="action-detail" class="mt-2 mb-2">{{getErrorMessage(n)}}</p>
        {{getStackError(n)}}
      </div>
    </div>
    <!-- <b-alert v-for="(n, index) in notifications"
      :key="index"
      :show="n.ttl ? n.ttl : true"
      ref="notifications"
      :state="n.state"
      :dismissible="n.dismissible"
      @dismissed="removeNotification(n)"
      @dismiss-count-down="onDismissCountDown($event, n)"> -->
  </div>
</template>

<script src="./notification-manager.js"></script>
<style scoped lang="scss" src="./notification-manager.scss"></style>

