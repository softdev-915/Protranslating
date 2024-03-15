<template>
  <div :class="{ 'blur-loading-row': isLoading, 'container-fluid': true }" data-e2e-type="machine-translation-settings">
    <div class="row" >
      <div class="col-12">
        <label for="use-mt">
          <input
            type="checkbox"
            name="use-mt"
            id="use-mt"
            data-e2e-type="mt-settings-use-mt"
            :checked="value.useMt"
            :disabled="!isUserIpAllowed"
            @input="update('useMt', $event.target.checked)">
          Use machine translation for the following language combinations
        </label>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <button
          type="button"
          class="btn btn-secondary px-4"
          data-e2e-type="mt-settings-add"
          :disabled="!isUserIpAllowed"
          @click="onAdd">
          Add
        </button>
      </div>
    </div>
    <div class="row">
      <div class="col-md-4">
        <table class="table table-sm table-striped table-stacked">
          <thead class="hidden-xs-down">
            <tr>
              <th>Language Combination</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              data-e2e-type="mt-settings-combination-item"
              v-for="(combination, index) of value.languageCombinations"
              :key="`${combination.tgtLang}_${combination.srcLang}`">
              <td data-e2e-type="mt-settings-combination-text">
                <b class="hidden-sm-up">Language Combination: </b>
                {{ combination.text }}
              </td>
              <td>
                <i
                  data-e2e-type="mt-settings-combination-remove"
                  class="fas fa-trash-alt pts-clickable"
                  :class="{'disabled': !isUserIpAllowed}"
                  v-on="getClickHandler('onCombinationRemove', index)"></i>
              </td>
              <td>
                <simple-basic-select
                  :options="getCombinationAvailableEngines(index)"
                  :format-option="formatEngine"
                  :value="getCombinationEngine(index)"
                  @select="setMtEngine($event, index)"
                  data-e2e-type="mt-settings-combination-mt-engine" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <language-combination-modal ref="languageCombinationModal" @save-combinations="onSaveCombinations" :default-mt-engine="defaultMtEngineId" :is-default-portal-mt="isDefaultEnginePortalMt"/>
  </div>
</template>

<script src="./mt-settings.js"></script>
<style scoped lang="scss" src="./mt-settings.scss"></style>
