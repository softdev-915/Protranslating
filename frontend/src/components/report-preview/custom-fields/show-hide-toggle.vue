<template>
  <div class="pts-clickable pull-right mb-2" data-e2e-type="show-hide-toggle">
    <i class="fas" :class="isHidden ? 'fa-eye' : 'fa-eye-slash'" aria-hidden="true"></i>
    <span class="toggle-btn">{{ isHidden ? 'Show' : 'Hide' }} the Field</span>
  </div>
</template>

<script>
export default {
  props: {
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
<style scoped lang="scss" src="./show-hide-toggle.scss"></style>
