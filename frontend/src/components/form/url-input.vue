<template>
  <div class="container p-0" :class="{'has-danger': (errors.has('urlInput')) && fullUrl !== ''}">
    <div class="input-group">
      <div class="input-group-prepend url-scheme-selector">
        <simple-basic-select
          v-model="protocol"
          :options="schemes"
          placeholder="Url"
          data-e2e-type="url-scheme-selector"
          class="input-group-text"
          title="Url"/>
      </div>
      <input type="url" name="urlInput" data-e2e-type="url-input" class="form-control url-host" aria-label="Url input" v-model="hostUrl" v-validate="{url: true }">
    </div>
    <!-- moving this outside to avoid lossing the border radius on the input -->
    <span class="form-control-feedback" v-show="(errors.has('urlInput')) && fullUrl !== ''">Url is invalid</span>
  </div>
</template>

<script src="./url-input.js"></script>
<style scoped src="./url-input.scss"></style>
