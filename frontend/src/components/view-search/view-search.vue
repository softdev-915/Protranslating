<template>
  <div
    v-show="sitemap"
    data-e2e-type="sitemap-container"
    class="view-search-container pts-overlay"
    @click="close()"
    aria-label="App help"
    role="search">
    <div class="search-item-container">
      <div class="search-item">
        <input
          type="text"
          aria-label="Filter views"
          v-model.trim="search"
          class="form-control" ref="searchInput"
          @click="$event.stopPropagation()"
          data-e2e-type="sitemap-search-input">
      </div>
      <div class="search-item list-group">
        <router-link
          :to="view.route"
          v-for="(view,index) in views"
          :key="view.route.name"
          :class="{'active': index === selectedIndex && !helpSelected}"
          class="list-group-item list-group-item-action flex-column align-items-start view-route-link">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1" :data-e2e-type='`sitemap-option-${view.route.name}`'>{{view.name}}</h5>
          </div>
          <p class="mb-1" :data-e2e-type='`sitemap-option-description-${view.route.name}`' >{{view.description}}</p>
          <small :data-e2e-type='`sitemap-option-keywords-${view.route.name}`'><span v-for="key in view.keywords" :key="key">{{key}}</span></small>
        </router-link>
        <div
          @click="showHelp()"
          class="list-group-item list-group-item-action flex-column align-items-start view-route-link pts-clickable"
          :class="{'active': helpSelected}">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">Help</h5>
          </div>
          <p class="mb-1">Application's help topic</p>
        </div>
        <div
          v-if="views.length === 0 && search.length > 0"
          class="list-group-item list-group-item-action flex-column align-items-start">
          No results found
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./view-search.js"></script>

<style scoped lang="scss" src="./view-search.scss"></style>
