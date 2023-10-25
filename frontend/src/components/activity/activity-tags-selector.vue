<template>
  <multi-select
    id="tagSelector"
    :options="tagsOptions"
    :selected-options="selected"
    :placeholder="placeholder"
    :isDisabled="disabled"
    :removeHandler="removeTagHandler"
    title="Tags"
    @select="onTagSelected"
    data-e2e-type="tagSelector"
  />
</template>

<script src="./activity-tags-selector.js"></script>
