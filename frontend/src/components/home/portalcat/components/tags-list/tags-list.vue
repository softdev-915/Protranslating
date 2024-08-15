<template>
  <div class="list-group" data-e2e-type="segment-tags-list">
    <a
      data-e2e-type="tags-list-tag"
      href="#"
      class="list-group-item list-group-item-action"
      :class="{ active: activeTag === index }"
      v-for="(tag, index) of tags"
      :key="tag.id + tag.function"
      @mousedown.prevent=""
      @click="emitTagPicked(index)">
      {{ formatTag(tag.data) }}
    </a>
  </div>
</template>

<script src="./tags-list.js"></script>