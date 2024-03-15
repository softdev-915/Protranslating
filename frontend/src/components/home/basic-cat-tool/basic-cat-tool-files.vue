<template>
  <div>
    <ul class="list-group" v-for="file in requestFiles" :key="file._id" :data-e2e-type="'basic-cat-tool-file-' + file.name">
      <router-link :to="{name: 'basic-cat-tool-file', params: { requestId: request._id, fileId: file._id }}" class="list-group-item list-group-item-action" active-class="active">
        <span class="text-truncate">{{file.name}}</span>
      </router-link>
    </ul>
  </div>
</template>

<script src="./basic-cat-tool-files.js"></script>
