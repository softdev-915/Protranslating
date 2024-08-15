<template>
  <div class="container">
    <div class="d-flex" v-if="!showModal">
      <div class="instructions-container">
        <div class="ellipsis">{{ instructions }}</div>
      </div>
      <i
        v-show="shouldShowIcon"
        data-e2e-type="provider-task-instructions-button"
        class="fas fa-eye eye-icon"
        aria-hidden="true"
        @click="openModal">
      </i>
    </div>

    <div v-if="showModal" class="content-container" data-e2e-type="provider-task-instructions-modal">
      <div class="content" tabindex="-1">
        <div class="text-container" data-e2e-type="provider-task-instructions-content">
          <p>{{ instructions }}</p>
        </div>
        <div class="action">
          <button
            class="btn btn-secondary pull-right"
            @click="closeModal"
            data-e2e-type="provider-task-instructions-modal-exit">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./offer-instructions-modal.js"></script>
<style scoped lang="scss" src="./offer-instructions-modal.scss"></style>
