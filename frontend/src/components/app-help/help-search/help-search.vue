<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12 input-group app-help-search">
        <input type="text" aria-label="Find more help topics" class="form-control" v-model.trim="search" placeholder="Find more help topics"  @keyup.enter="performSearch()">
        <span class="input-group-addon pts-clickable" @click="performSearch()"><i class="fas fa-search"></i></span>
      </div>
    </div>
    <div class="row help-search-results" v-for="topic in topics">
      <div class="col-12">
        <div>
          <h5 class="mb-1 pts-clickable" @click="selectTopic(topic)">{{topic.title}}</h5>
        </div>
        <p class="mb-1 pts-clickable" @click="selectTopic(topic)"><contextual-text :text="topic.unformattedHelp" :search="search" :size="10"></contextual-text></p>
      </div>
    </div>
    <div class="help-search-results" v-if="searchDirty && topics.length === 0 && search.length > 0">
      No results found
    </div>
  </div>
</template>

<script src="./help-search.js"></script>

<style scoped lang="scss" src="./help-search.scss"></style>