<template>
  <div class="row">
    <div class="col-12 mt-1">
      <h5>Custom Queries settings</h5>
      <hr class="my-1" />
      <div class="container-fluid">
        <div class="row align-items-center">
          <div class="col-12 col-md-2 pl-4">
            Report cache (minutes)
          </div>
          <div class="col-12 col-md-1">
            <input
              v-model.number="settings.reportCache"
              type="number"
              min="0"
              class="form-control"
              data-e2e-type="lsp-settings-custom-query-report-cache">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./lsp-settings-custom-query.js"></script>
