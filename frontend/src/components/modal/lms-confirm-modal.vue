<template>
  <lms-modal v-model="isVisible" :modal-data-e2e="modalDataE2e">
    <h5>{{ title  }}</h5>
    <h6 class="my-4">{{ message }}</h6>
    <div class="row justify-content-end">
      <button 
        class="btn btn-new-primary"
        data-e2e-type="lms-modal-submit-button" 
        @click="submit">{{ confirmText }}</button>
      <button 
        class="btn btn-new-removal mx-2"
        data-e2e-type="lms-modal-cancel-button"
        @click="cancel">{{ cancelText }}</button>
    </div>
  </lms-modal> 
</template>

<script src="./lms-confirm-modal.js" />