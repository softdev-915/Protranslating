<template>
  <div>
    <div class="card kpi-card">
      <div class="card-body">
        <div class="row m-0">
          <div class="col-9 py-3 pl-3">
            <div class="row">
              <div class="col-12">
                <span class="card-title text-muted mb-0">{{ title }}</span>
              </div>
              <div class="col-12 mt-2">
                <span :data-e2e-type="dataE2eType" class="h4 font-weight-bold mb-0">{{ value }}</span>
              </div>
            </div>
          </div>
          <div class="col-3 pr-3 pl-0 pt-3 text-right">
            <slot name="icon" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script src="./kpi-card.js"></script>
<style lang="scss" src="./kpi-card.scss"></style>
