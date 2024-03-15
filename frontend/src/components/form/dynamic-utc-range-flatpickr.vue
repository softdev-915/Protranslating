<template>
  <div class="container-fluid dynamic-utc-range-picker-container" @click="$event.stopPropagation()">
    <div class="row">
      <div class="col-12 pt-1 pb-2 pr-2 d-flex align-center justify-content-between">
        <span class="pr-1">
          <button
            class="btn btn-danger reset-button"
            data-e2e-type="reset-button"
            @click="onReset()"
          >Reset</button>
        </span>
        <span class="pr-1">
          <button
            class="btn btn-primary apply-button"
            data-e2e-type="apply-button"
            @click="onApply()"
          >Apply</button>
        </span>
      </div>
      <div class="col-md-5 hidden-sm-down">
        <ul class="list-group" data-e2e-type="dynamic-parameters">
          <!-- we cannot use mousedown.left with mouseup.left -->
          <!-- otherwise it will not trigger mouseup-->
          <li
            v-for="(range, rangeKey) in ranges"
            :key="rangeKey"
            @mousedown="onRangeMouseDown($event, rangeKey)"
            @mouseup="onRangeMouseUp($event, rangeKey)"
            class="list-group-item p-1"
            :data-e2e-type="range.name"
            :class="{'active': rangeTitle === rangeKey}">
            <span>{{range.name}}</span>
          </li>
        </ul>
      </div>
      <div class="col-12 hidden-md-up">
        <simple-basic-select
          v-model="rangeTitle"
          placeholder="Range selector"
          :options="rangeOptions"
          :format-option="({ text, value }) => ({ text, value })"/>
      </div>
      <div class="col-12 col-md-7 pl-0">
        <utc-range-flatpickr data-e2e-type="dynamic-flatpickr" v-model="dateRange" :config="config" />
      </div>
    </div>
  </div>
</template>

<script src="./dynamic-utc-range-flatpickr.js"></script>
<style lang="scss" src="./dynamic-utc-range-flatpickr-global.scss"></style>
