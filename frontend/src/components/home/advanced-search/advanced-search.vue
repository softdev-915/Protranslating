<template>
  <div class="advanced-search-container">
    <div class="row">
      <div class="col-12 advanced-search-title">
        <h5><i class="fas fa-filter"></i>ADVANCED SEARCH<i class="fas pull-right arrow" @click="expanded = !expanded" :class="arrowClass"></i></h5>
      </div>
    </div>
    <div class="row advanced-search-form" v-show="expanded">
      <div class="col-lg-3 col-12 advanced-search-option">
        <label>
            Received From
          </label>
        <div class="advanced-search-input">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="mm/dd/yyyy">
            <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-12 advanced-search-option">
        <label>
            Received To
          </label>
        <div class="advanced-search-input">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="mm/dd/yyyy">
            <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-12 advanced-search-option">
        <label>
            Delivered From
          </label>
        <div class="advanced-search-input">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="mm/dd/yyyy">
            <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-12 advanced-search-option">
        <label>
            Delivered To
          </label>
        <div class="advanced-search-input">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="mm/dd/yyyy">
            <span class="input-group-addon"><i class="fas fa-calendar"></i></span>
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-12 advanced-search-option">
        <label>
            Request Number
          </label>
        <div class="advanced-search-input">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="mm/dd/yyyy">
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-12 advanced-search-option">
        <label>
            Contact
          </label>
        <div class="advanced-search-input">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="mm/dd/yyyy">
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-12 advanced-search-option">
        <label>
            Title
          </label>
        <div class="advanced-search-input">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="mm/dd/yyyy">
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-12 advanced-search-option">
        <label>
            Status
          </label>
        <div class="advanced-search-input">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="mm/dd/yyyy">
          </div>
        </div>
      </div>
      <div class="col-12 pull-right advanced-search-option">
        <button class="btn btn-primary pull-right search-button">Search</button>
        <button class="btn btn-danger pull-right remove-filters-button" disabled>Remove Filters</button>
      </div>
    </div>
  </div>
</template>
<script src="./advanced-search.js"></script>
<style scoped lang="scss" src="./advanced-search.scss"></style>
