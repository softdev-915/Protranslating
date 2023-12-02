<template>
  <div class="lms-modal" v-if="value">
    <div class="lms-modal_overlay" @click="dismiss"/>
    <div class="lms-modal_body" :data-e2e-type="modalDataE2e">
      <slot />
    </div>
  </div>
</template>

<script src="./lms-modal.js" />
<style src="./lms-modal.scss" lang="scss" />
