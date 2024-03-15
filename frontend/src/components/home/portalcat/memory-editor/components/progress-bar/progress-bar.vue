<template>
  <div class="ui-set-progress-bar" data-e2e-type="memory-editor-progress-bar">
    <div class="row">
      <div class="col-12 col-lg-3">
        <div class="info-container" data-e2e-type="progressbar-tm-name">
          <p class="mb-0 font-weight-bold">
            {{ tmName }}
          </p>
        </div>
      </div>
      <div class="col-12 col-lg-9">
        <div class="info-container" data-e2e-type="progressbar-tm-info">
          <p class="mb-0">{{progressBarText}}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./progress-bar.js"></script>
