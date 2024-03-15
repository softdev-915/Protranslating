<template>
  <div class="w-100">
    <div class="ip-file-upload" :class="{'drag-over': isDragOver, 'ip-danger ip-danger-dotted': required}" @dragover="dragover" @dragleave="dragleave" @drop="drop">
      Drag & Drop Source/Reference files here or
      <label for="ref-file"> <u>Choose a file</u> </label>
      <input 
        type="file"
        id="ref-file"
        ref="file"
        hidden
        multiple 
        @change="onChange" 
        :data-e2e-type="dataE2eType"/>
    </div>
    <ip-uploaded-file 
      class="mt-2 mr-2" 
      v-for="file in filelist" 
      :key="file.name" 
      :file="getFileInfo(file)"
      @remove-file="onFileRemove"
    />
  </div>
</template>

<style src="./ip-file-upload.scss" lang="scss" scoped></style>
<script src="./ip-file-upload.js"></script>
