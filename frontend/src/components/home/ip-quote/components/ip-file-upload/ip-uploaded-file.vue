<template>
  <div class="ip-uploaded-file">
    <i :class="`fas ${fileTypeIconClassesMap[file.ext]} ${getIconClassName(file.ext)}`"/>
    <span class="ml-2">{{ file.name }}</span>
    <span class="ml-2">({{ fileSize }})</span>
    <template v-if="showControls">
      <a :href="file.objectUrl"  :download="file.name"> <i class="ml-2 fas fa-download"/></a>
      <i class="ml-2 fas fa-times" @click="removeFile"/>
    </template>
  </div>
</template>


<script src="./ip-uploaded-file.js"></script>
<style src="./ip-uploaded-file.scss" scoped lang="scss"></style>