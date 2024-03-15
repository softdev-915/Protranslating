<template>
  <div class="vqb-group card" :class="`depth-${depth}`" :data-e2e-type="`custom-query-filter-group-${depth}-${index}`">
    <div class="vqb-group-heading card-header">
      <div class="row align-items-center">
        <div class="col-1">{{ labels.matchType }}</div>
        <div class="col-2 pt-2">
          <div v-for="label in labels.matchTypes" :key="label.id" class="form-check form-check-inline">
            <label class="form-check-label">
              <input
                v-model="query.logicalOperator"
                type="radio"
                :value="label.id"
                class="form-check-input"
                :data-e2e-type="`custom-query-filter-group-logical-operator-${logicalOperators[label.id]}`">
              {{ label.label }}
            </label>
          </div>
        </div>
        <div class="col-1">
          <button
            v-if="depth > 1"
            v-html="labels.removeGroup"
            type="button"
            class="close"
            data-e2e-type="custom-query-filter-group-remove"
            @click="remove">
          </button>
        </div>
      </div>
    </div>
    <div class="vqb-group-body card-body">
      <div class="row align-items-center">
        <div class="col-9" :class="{ 'has-danger': commonError !== '' }">
          <simple-basic-select
            v-model="selectedRule"
            :options="rules"
            :format-option="formatRuleSelectOption"
            placeholder="Select field"
            :is-error="commonError !== ''"
            data-e2e-type="custom-query-filter-group-field"
          />
          <span class="form-control-feedback">{{ commonError }}</span>
        </div>
        <div class="col-3">
          <button
            type="button"
            class="btn btn-secondary mr-2"
            data-e2e-type="custom-query-filter-group-add-rule"
            @click="addRule">
            {{ labels.addRule }}
          </button>
          <button
            v-if="depth < maxDepth"
            type="button"
            class="btn btn-secondary"
            data-e2e-type="custom-query-filter-group-add-group"
            @click="addGroup">
            {{ labels.addGroup }}
          </button>
        </div>
      </div>
      <query-builder-children v-bind="$props"/>
    </div>
  </div>
</template>

<script src="./query-builder-group.js"></script>

<style src="./query-builder-group.scss" lang="scss"></style>
