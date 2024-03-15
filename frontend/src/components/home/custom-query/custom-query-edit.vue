<template>
  <div class="pts-grid-edit-modal" data-e2e-type="custom-query-edit" :class="{ 'blur-loading-row': httpRequesting || isLoading }">
    <div slot="default">
      <div class="container-fluid">
        <div class="row">
          <div class="col-6">
            <div class="row align-items-center">
              <div class="col-12 col-md-2">
                <label for="custom-query-input-name">
                  Name <span class="pts-required-field">*</span>
                </label>
              </div>
              <div class="col-12 col-md-10" :class="{ 'has-danger': nameError !== '' }">
                <input
                  id="custom-query-input-name"
                  v-model.trim="customQuery.name"
                  name="name"
                  autofocus
                  class="form-control"
                  data-e2e-type="custom-query-name">
                <span class="form-control-feedback">{{ nameError }}</span>
              </div>
            </div>
            <div v-if="!isNew" class="row align-items-center checkbox-container">
              <div class="col-11 col-md-2">
                <label for="custom-query-input-inactive">Inactive</label>
              </div>
              <div class="col-1 col-md-10">
                <input
                  id="custom-query-input-inactive"
                  v-model="customQuery.deleted"
                  type="checkbox"
                  class="form-control pts-clickable"
                  value="true"
                  data-e2e-type="custom-query-inactive">
              </div>
            </div>
            <div class="row">
              <div class="col-12 mt-1">
                <h5>Entities <span class="pts-required-field">*</span></h5>
                <hr class="my-1"/>
                <div class="container-fluid">
                  <div v-for="(options, i) in entitiesSelectOptions" :key="i" class="row align-items-center">
                    <div class="col-12 col-md-2">
                      <label>Entity #{{ i + 1 }}</label>
                    </div>
                    <div class="col-9" :class="{ 'has-danger': entitiesError !== '' && i === 0 }">
                      <simple-basic-select
                        v-model="customQuery.entities[i]"
                        :options="options"
                        :format-option="formatEntitySelectOption"
                        :placeholder="`Select entity #${i + 1}`"
                        :is-error="i === 0 && entitiesError !== ''"
                        :data-e2e-type="`custom-query-entity-${i}`"
                        @change="onEntityChange($event, i)"
                      />
                      <span v-if="i === 0" class="form-control-feedback">{{ entitiesError }}</span>
                    </div>
                    <div class="col-1">
                      <i
                        v-if="allowedRemoveEntityMap[i]"
                        class="fas fa-trash fa-trash-o cursor-pointer"
                        title="Remove entity"
                        :data-e2e-type="`custom-query-entity-delete-${i}`"
                        @click="customQuery.entities.splice(i, 1)"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card mb-2">
              <div class="card-header">
                <a
                  href="javascript:"
                  data-e2e-type="custom-query-toggle-preferences"
                  @click="showPreferences = !showPreferences">
                  <i class="fas fa-cog"></i>&nbsp;Preferences
                </a>
              </div>
              <div class="collapse" :class="{ show: showPreferences }">
                <div class="card-block">
                  <custom-query-preference-edit
                    :entity-id="customQuery._id"
                    :can-edit="canEdit"
                    :is-run-forced="isRunForced"
                    @cancel-forced-run="isRunForced = false"/>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <a
                  href="javascript:"
                  data-e2e-type="custom-query-toggle-additional-info"
                  @click="showAdditionalInfo = !showAdditionalInfo">
                  <i class="fas fa-info-circle"></i>&nbsp;Additional Info
                </a>
              </div>
              <div class="collapse" :class="{ show: showAdditionalInfo }">
                <div v-for="field in additionalInfoFields" :key="field.name" class="card-block">
                  <div class="row align-items-center">
                    <div class="col-12 col-md-2">
                      <label>{{ field.humanName }}</label>
                    </div>
                    <div class="col-12 col-md-10">
                      <input
                        :value="field.value"
                        class="form-control"
                        disabled
                        :data-e2e-type="`custom-query-${field.e2eName}`">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template v-if="customQuery.entities.length > 0">
          <div class="row">
            <div class="col-12 mt-1">
              <h5>Fields <span class="pts-required-field">*</span></h5>
              <hr class="my-1"/>
              <div class="container-fluid">
                <div class="row">
                  <div class="col-2">
                    <label>Aggregated function</label>
                  </div>
                  <div class="col-6">
                    <label>Field name</label>
                  </div>
                  <div class="col-2">
                    <label>Field alias</label>
                  </div>
                </div>
                <template>
                  <div v-for="(field, i) in customQuery.fields" :key="i" class="row align-items-center">
                    <div class="col-2" :class="{ 'has-danger': fieldFunctionErrorMap[i] !== '' }">
                      <simple-basic-select
                        v-model="customQuery.fields[i].function"
                        :options="functionSelectOptions"
                        placeholder="No function"
                        :is-error="fieldFunctionErrorMap[i] !== ''"
                        :data-e2e-type="`custom-query-field-${i}-function`"/>
                      <span class="form-control-feedback">{{ fieldFunctionErrorMap[i] }}</span>
                    </div>
                    <div
                      class="col-5"
                      :class="{ 'has-danger': (fieldsError !== '' && i === 0) || fieldPathErrorMap[i] !== '' }">
                      <simple-basic-select
                        v-model="customQuery.fields[i].field"
                        :options="fieldSelectOptions"
                        :format-option="formatFieldSelectOption"
                        :empty-option="{ text: '', value: {} }"
                        :placeholder="fieldSelectOptions.length > 0 ? 'Select field' : 'Select entity first'"
                        :is-error="(i === 0 && fieldsError !== '') || fieldPathErrorMap[i] !== ''"
                        :data-e2e-type="`custom-query-field-${i}-field`"
                        @select="onSelectField(i)"
                        @delete="onDeleteField(i)"/>
                      <span v-if="i === 0" class="form-control-feedback">{{ fieldsError }}</span>
                      <span class="form-control-feedback">{{ fieldPathErrorMap[i] }}</span>
                    </div>
                    <div class="col-1">AS</div>
                    <div class="col-2" :class="{ 'has-danger': fieldAliasErrorMap[i] !== '' }">
                      <input
                        v-model="customQuery.fields[i].alias"
                        placeholder="No alias"
                        class="form-control"
                        :data-e2e-type="`custom-query-field-${i}-alias`">
                      <span class="form-control-feedback">{{ fieldAliasErrorMap[i] }}</span>
                    </div>
                    <div class="col-1">
                      <div class="row">
                        <div v-if="allowedMoveFieldDownMap[i]" class="col">
                          <i
                            class="fas fa-arrow-down cursor-pointer"
                            title="Move field down"
                            :data-e2e-type="`custom-query-field-${i}-move-down`"
                            @click="swapFields(i, i + 1)"></i>
                        </div>
                        <div v-if="allowedMoveFieldUpMap[i]" class="col">
                          <i
                            class="fas fa-arrow-up cursor-pointer"
                            title="Move field up"
                            :data-e2e-type="`custom-query-field-${i}-move-up`"
                            @click="swapFields(i, i - 1)"></i>
                        </div>
                      </div>
                    </div>
                    <div class="col-1">
                      <i
                        v-if="allowedRemoveFieldMap[i]"
                        class="fas fa-trash fa-trash-o cursor-pointer"
                        title="Remove field"
                        :data-e2e-type="`custom-query-field-delete-${i}`"
                        @click="customQuery.fields.splice(i, 1)"></i>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12 mt-1">
              <h5>Filter</h5>
              <hr class="my-1"/>
              <div class="container-fluid">
                <div class="row align-items-center">
                  <div class="col-12">
                    <vue-query-builder v-model="filterQuery" :rules="filterRules">
                      <template slot-scope="slotProps">
                        <query-builder-group v-bind="slotProps" :query.sync="filterQuery"/>
                      </template>
                    </vue-query-builder>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-6 mt-1">
              <h5>Group by</h5>
              <hr class="my-1"/>
              <div class="container-fluid">
                <div v-for="(options, i) in groupBySelectOptions" :key="i" class="row align-items-center">
                  <div class="col-6">
                    <simple-basic-select
                      v-model="customQuery.groupBy[i]"
                      :options="options"
                      :format-option="formatFieldSelectOption"
                      :empty-option="{ text: '', value: {} }"
                      :placeholder="options.length === 0 ? 'Select field first' : 'No group by'"
                      :data-e2e-type="`custom-query-group-by-${i}`"
                      @select="onSelectGroupBy(i)"
                      @delete="onDeleteGroupBy(i)"/>
                  </div>
                  <div class="col-2">
                    <i
                      v-if="allowedRemoveGroupByMap[i]"
                      class="fas fa-trash fa-trash-o cursor-pointer"
                      title="Remove group by"
                      :data-e2e-type="`custom-query-group-by-delete-${i}`"
                      @click="onDeleteGroupBy(i)"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-6 mt-1">
              <h5>Order by</h5>
              <hr class="my-1"/>
              <div class="container-fluid">
                <div v-for="(fieldOptions, i) in orderByFieldSelectOptions" :key="i" class="row align-items-center">
                  <div class="col-6" :class="{ 'has-danger': orderByFieldErrorMap[i] !== '' }">
                    <simple-basic-select
                      v-model="customQuery.orderBy[i].fieldData"
                      :options="fieldOptions"
                      :format-option="formatOrderByFieldSelectOption"
                      :empty-option="{ text: '', value: {} }"
                      :placeholder="fieldOptions.length === 0 ? 'Select entity first' : 'No order by'"
                      :data-e2e-type="`custom-query-order-by-${i}-field`"
                      :is-error="orderByFieldErrorMap[i] !== ''"
                      @select="onSelectOrderBy(i)"
                      @delete="onDeleteOrderBy(i)"/>
                    <span class="form-control-feedback">{{ orderByFieldErrorMap[i] }}</span>
                  </div>
                  <div class="col-3" :class="{ 'has-danger': orderBySortErrorMap[i] !== '' }">
                    <simple-basic-select
                      v-model="customQuery.orderBy[i].sort"
                      :options="['asc', 'desc']"
                      :selected-option="customQuery.orderBy[i].sort"
                      placeholder="No sort option"
                      :is-error="orderBySortErrorMap[i] !== ''"
                      :data-e2e-type="`custom-query-order-by-${i}-sort`"/>
                    <span class="form-control-feedback">{{ orderBySortErrorMap[i] }}</span>
                  </div>
                  <div class="col-2">
                    <i
                      v-if="allowedRemoveOrderByMap[i]"
                      class="fas fa-trash fa-trash-o cursor-pointer"
                      title="Remove order by"
                      :data-e2e-type="`custom-query-order-by-delete-${i}`"
                      @click="onDeleteOrderBy(i)"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div slot="modal-footer" class="form-actions mt-5 pl-4">
      <div class="row">
        <div class="col-12">
          <h5>JSON query</h5>
          <hr class="my-1 mb-2"/>
          <textarea rows="30" style="height:100%;" class="form-control" data-e2e-type="custom-query-json" readonly v-model="customQueryJson"></textarea>
        </div>
      </div>
      <div class="row mt-5">
        <div class="col-12 mt-3">
          <button
            class="btn btn-success"
            :disabled="!isRunAvailable"
            data-e2e-type="custom-query-run"
            @click="onClickRun">
            Run
          </button>
          <button
            id="custom-query-copy"
            class="btn btn-primary"
            data-e2e-type="custom-query-copy"
            @click="onClickCopy">
            Copy
          </button>
          <button
            id="custom-query-paste"
            class="btn btn-primary"
            data-e2e-type="custom-query-paste"
            @click="onClickPaste">
            Paste
          </button>
          <button
            id="custom-query-download"
            class="btn btn-primary"
            data-e2e-type="custom-query-download"
            @click="onClickDownload">
            Download
          </button>
          <file-upload
            accept=".json"
            @on-file-selected="onUpload">
            <button
              slot="file-upload-button"
              id="custom-query-upload"
              class="btn btn-primary"
              data-e2e-type="custom-query-upload">
              Upload
            </button>
          </file-upload>
          <button class="btn btn-secondary pull-right" @click="cancel">{{ cancelText }}</button>
          <button v-if="canEdit"
            :disabled="!isValid"
            data-e2e-type="custom-query-save"
            class="btn btn-primary pull-right mr-2"
            @click="save">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./custom-query-edit.js"></script>
