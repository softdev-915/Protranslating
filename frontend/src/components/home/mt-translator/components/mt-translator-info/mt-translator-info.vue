<template>
  <div class="row mb-2">
    <div class="col-12">
      <div class="row">
        <div
          class="col-12 d-inline cursor-pointer"
          data-e2e-type="mt-translator-models-nodes-expand"
          @click="onExpandClick">
          <i class="fas" :class="isExpanded ? 'fa-angle-up' : 'fa-angle-down'"></i>
          <span>Models and nodes</span>
        </div>
      </div>
      <div v-if="isExpanded" class="row" data-e2e-type="mt-translator-models-nodes">
        <div class="col-6">
          <table class="table table-bordered table-sm mt-translator-info-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Node</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {{ mtModel }}
                </td>
                <td>
                  {{ mtNode }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<script src="./mt-translator-info.js"></script>
<style scoped lang="scss" src="./mt-translator-view.scss"></style>
