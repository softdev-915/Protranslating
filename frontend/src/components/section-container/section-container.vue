<template>
  <div class="container-fluid responsive-section-container" :class="customClass">
    <div class="row main-section-container">
      <div class="col-12 d-flex flex-column">
      <!-- container starts -->

        <h1 role="banner" class="screen-reader-text">{{ title }}</h1>
        <div class="detail-container w-100" :class="{ 'h-100': fullHeight }">
          <div class="pts-panel-body">

            <!-- main slot -->
            <slot></slot>

          </div>
        </div>

        <div class="detail-container full-height">
          <div class="pts-panel-body">
            <slot name="full-height"></slot>
          </div>
        </div>

      <!-- container ends -->
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./section-container.scss"></style>
<script src="./section-container.js"></script>
