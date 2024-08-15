<template>
  <div
    class="portalcat-resources-search-result tb"
    data-e2e-type="resources-search-result"
    ref="searchResult"
    @click="onClick">
    <div class="search-match mb-1">
      <div class="row">
        <div class="col">
          <strong class="mb-0">
            <span data-e2e-type="search-result-source">{{ sourceText }}</span> = <span data-e2e-type="search-result-target">{{ targetText }}</span>
          </strong>
        </div>
        <div class="col-auto">
          <a
            href="#"
            class="apply-resource-btn btn btn-link"
            @click.stop.prevent="$emit('resource-apply')"
            data-e2e-type="search-result-apply-btn">
            <i class="fas fa-angle-double-right"></i>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./resources-tb-search-result.js"></script>