<template>
  <div class="d-flex align-items-center" data-e2e-type="check-memo">
    <div class="d-inline-block mr-3">
      <span v-if="!isEditMode">{{ memoToDisplay }}</span>
      <input type="text" v-model="check.memo" v-else data-e2e-type="check-memo-input">
    </div>
    <button type="button" class="btn btn-secondary fas fa-pencil" data-e2e-type="check-memo-switch-mode" v-if="!isEditMode" @click="switchEditMode"></button>
    <template v-else>
      <button type="button" class="btn btn-secondary fas fa-times" data-e2e-type="check-memo-switch-mode" @click="switchEditMode"></button>
      <button type="button" class="btn btn-secondary fas fa-check" data-e2e-type="check-memo-save" @click="save"></button>
    </template>
  </div>
</template>

<script src="./check-memo-edit.js"></script>