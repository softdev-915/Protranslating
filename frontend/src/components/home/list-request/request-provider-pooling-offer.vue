<template>
  <div class="request-provider-pooling-container">
    <div>
      <div class="container-fluid" data-e2e-type="request-ppo-detail">
        <div class="p-1">
          <div class="row">
            <h5>Offer Details</h5>
            <div class="d-flex">
              <div class="label-container py-2">
                <label for="urgent" class="mx-4"><strong>Urgent</strong></label>
              </div>
              <input
                id="urgent"
                type="checkbox"
                class="form-control"
                value="true"
                data-e2e-type="request-ppo-urgent-checkbox"
                v-model="offer.isUrgent"
                :disabled="isOfferActive"
              />
            </div>
            <div class="d-flex" v-if="!isProdEnv">
              <div class="label-container py-2">
                <label class="mx-3"><strong>Mocked</strong></label>
              </div>
              <input
                type="checkbox"
                class="form-control"
                value="true"
                data-e2e-type="request-ppo-mocked-checkbox"
                v-model="offer.mock"
                disabled
              />
            </div>
          </div>
          <hr class="my-1" />
        </div>
        <div class="row">
          <div class="col-12 col-md-6">
            <div class="label-container py-2">
              <label for="requestNo"><strong>Request No</strong></label>
            </div>
            <input
              id="requestNo"
              type="text"
              disabled
              class="form-control"
              data-e2e-type="request-ppo-no"
              :value="offer.request.no"
            />
          </div>
          <div class="col-12 col-md-6">
            <div class="label-container py-2">
              <label for="providerTask"><strong>Provider Task</strong></label>
            </div>
            <input
              id="providerTask"
              type="text"
              disabled
              class="form-control"
              data-e2e-type="request-ppo-provider-task"
              :value="offer.abilityId.name"
            />
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-6">
            <div class="label-container py-2">
              <label for="language"><strong>Language</strong></label>
            </div>
            <input
              id="language"
              type="text"
              disabled
              class="form-control"
              data-e2e-type="request-ppo-language"
              :value="offer.languageCombination.text"
            />
          </div>
          <div class="col-12 col-md-6 row">
            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong>
                    <span class="pts-required-field">*</span>
                    Task Start Date
                  </strong>
                </label>
              </div>
              <utc-flatpickr
                data-e2e-type="request-ppo-task-start-date"
                placeholder="Start date"
                tabindex="0"
                :config="datepickerOptions"
                class="form-control pr-3 task-start-datepick"
                :class="{ 'has-danger': !isValidStartDate }"
                v-model="offer.startDate"
                :disabled="isOfferActive"
              />
              <span
                v-show="!isValidStartDate"
                class="has-error"
                data-e2e-type="request-ppo-task-start-date-error"
                >This is a mandatory field and cannot be empty</span>
            </div>
            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong>
                    <span class="pts-required-field">*</span>
                    Task Due Date
                  </strong>
                </label>
              </div>
              <utc-flatpickr
                data-e2e-type="request-ppo-task-due-date"
                placeholder="Due date"
                tabindex="0"
                :config="datepickerOptions"
                class="form-control pr-3 task-due-datepick"
                :class="{ 'has-danger': !isValidDueDate }"
                v-model="offer.dueDate"
                :disabled="isOfferActive"
              />
              <span
                v-show="!isValidDueDate"
                class="has-error"
                data-e2e-type="request-ppo-task-due-date-error"
                >This is a mandatory field and cannot be empty</span>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-6 row">
            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong> Max. Rate </strong>
                </label>
              </div>
              <currency-input
                type="text"
                class="form-control"
                data-e2e-type="request-ppo-max-rate"
                v-model="offer.maxRate"
                :currency="null"
                :disabled="isOfferActive"
              />
            </div>

            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong>
                    <span class="pts-required-field">*</span>
                    Units
                  </strong>
                </label>
              </div>
              <simple-basic-select
                data-e2e-type="request-ppo-units"
                :options="translationUnitOptions"
                :empty-option="{ text: '', value: null }"
                :allow-selected-not-in-list="!this.hasOfferTaskFetched"
                :mandatory="true"
                :fetch-on-created="false"
                :format-option="({ _id, name }) => ({ text: name, value: _id })"
                :disabled="isOfferActive"
                v-model="offer.translationUnitId"
              />
              <span
                v-show="!offer.translationUnitId"
                class="has-error"
                data-e2e-type="request-ppo-units-error"
                >This is a mandatory field and cannot be empty</span>
            </div>
          </div>
          <div class="col-12 col-md-6 row">
            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong> No. Files for Translation </strong>
                </label>
              </div>
              <input
                type="text"
                disabled
                class="form-control"
                data-e2e-type="request-ppo-no-files-for-translation"
                :value="offer.filesAmount"
              />
            </div>

            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong> No. Files for Reference </strong>
                </label>
              </div>
              <input
                type="text"
                disabled
                class="form-control"
                data-e2e-type="request-ppo-no-files-for-reference"
                :value="offer.referenceAmount"
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-6 row">
            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong> Quantity </strong>
                </label>
              </div>
              <input
                type="text"
                class="form-control"
                data-e2e-type="request-ppo-quantity"
                v-model="offer.quantity"
                :disabled="isOfferActive"
              />
            </div>
            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong> Breakdown </strong>
                </label>
              </div>
              <simple-basic-select
                data-e2e-type="request-ppo-breakdowns"
                :options="breakdownOptions"
                :mandatory="false"
                :allow-selected-not-in-list="!this.hasOfferTaskFetched"
                :empty-option="{ text: '', value: null }"
                :fetch-on-created="false"
                :format-option="({ _id, name }) => ({ text: name, value: _id })"
                :disabled="isOfferActive"
                v-model="offer.breakdownId"
              />
            </div>
          </div>
          <div class="col-12 col-md-6 row">
            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong title="Enter number between 1 and 3">
                    <span class="pts-required-field">*</span>
                    No. of Rounds
                  </strong>
                </label>
              </div>
              <input
                type="number"
                :class="{ 'has-danger': !isValidRoundsNo }"
                data-e2e-type="request-ppo-no-rounds"
                class="form-control"
                v-model.trim="offer.roundsNo"
                :disabled="isOfferActive"
              />
              <span
                v-if="isNumberRoundsNo && !isInsideRangeRoundsNo"
                class="has-error"
                data-e2e-type="request-ppo-no-rounds-error"
                >Enter number between 1 and 3</span>
              <span
                v-if="!isNumberRoundsNo"
                class="has-error"
                data-e2e-type="request-ppo-no-rounds-error"
                >This is a mandatory field and cannot be empty</span>
            </div>

            <div class="col-12 col-md-6">
              <div class="label-container py-2">
                <label>
                  <strong title="Enter number between 1 and 25">
                    <span class="pts-required-field">*</span>
                    No. of Providers per Round
                  </strong>
                </label>
              </div>
              <input
                type="number"
                class="form-control"
                :class="{ 'has-danger': !isValidProviderPerRoundNo }"
                data-e2e-type="request-ppo-no-providers-per-round"
                v-model="offer.providersPerRoundNo"
                :disabled="isOfferActive"
              />
              <span
                v-if="isNumberProviderPerRoundNo && !isInsideRangeProviderPerRoundNo"
                class="has-error"
                data-e2e-type="request-ppo-no-providers-error"
                >Enter number between 1 and 25</span>
              <span
                v-if="!isNumberProviderPerRoundNo"
                class="has-error"
                data-e2e-type="request-ppo-no-providers-error"
                >This is a mandatory field and cannot be empty</span>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12 col-md-6">
            <div class="label-container py-2">
              <label for="requestNo">
                <strong>
                  <span class="pts-required-field">*</span>
                  Sort by
                </strong>
              </label>
            </div>
            <simple-basic-select
              data-e2e-type="request-ppo-sort-by-select"
              :options="sortByOptions"
              :mandatory="true"
              :format-option="({ text, value }) => ({ text, value })"
              :disabled="isOfferActive"
              v-model="offer.sortBy"
            />
            <span
              v-show="!offer.sortBy"
              class="has-error"
              data-e2e-type="request-ppo-sort-by-error"
              >This is a mandatory field and cannot be empty</span>
          </div>
        </div>

        <div class="row">
          <div class="col-12 mb-4 editor-container">
            <label class="mb-2">
              <strong>Provider Task Instructions</strong>
            </label>
            <textarea
              class="form-control"
              v-model.trim="offer.providerTaskInstructions"
              data-e2e-type="request-ppo-provider-task-instructions"
              :disabled="isOfferActive"
            ></textarea>
          </div>
        </div>
        <request-provider-search-grid
          v-if="!shouldHideGrid"
          v-model="offer.selectedProviders"
          :is-new-offer="isNewOffer"
          :grid-query="gridQuery"
          :row-selection-disabled="isOfferActive"
          @provider-rates-loaded="onProviderRatesLoaded"
          @is-loading="isLoadingProviders"
        />
        <div class="row">
          <div class="col-12 mt-4">
            <h5>JSON offer</h5>
          </div>
          <div class="col-12">
            <textarea
              rows="3"
              class="form-control"
              readonly
              data-e2e-type="json-offer"
              v-model="copyableOfferFieldsString"
              @keydown.ctrl.86.prevent.stop="onOfferPasteFromClipboard"
            />
          </div>
        </div>
        <div class="p-2 mt-5 d-flex">
          <button
            class="btn btn-success mr-1"
            data-e2e-type="request-ppo-send-offer-btn"
            @click="sendOffer"
            :disabled="isSendButtonDisabled"
          >
            Send Offer
          </button>
          <button
            class="btn btn-secondary mr-1"
            data-e2e-type="request-ppo-close-btn"
            @click="closeOffer"
            :disabled="!isOfferActive"
          >
            Close Offer
          </button>
          <button
            class="btn btn-primary mr-1"
            data-e2e-type="request-ppo-copy-btn"
            @click="onOfferCopy"
          >
            Copy
          </button>
          <button
            class="btn btn-primary mr-1"
            data-e2e-type="request-ppo-paste-btn"
            :disabled="isOfferActive"
            @click="onOfferPaste"
          >
            Paste
          </button>
          <button
            id="request-ppo-download"
            class="btn btn-primary mr-1"
            data-e2e-type="request-ppo-download"
            @click="onClickDownload"
          >
            Download
          </button>
          <file-upload accept=".json" @on-file-selected="onUpload">
            <button
              slot="file-upload-button"
              id="request-ppo-upload"
              class="btn btn-primary mr-1"
              :disabled="isOfferActive"
              data-e2e-type="request-ppo-upload"
            >
              Upload
            </button>
          </file-upload>

          <button
            class="btn btn-primary ml-auto mr-1"
            data-e2e-type="request-ppo-save-btn"
            :disabled="isSaveButtonDisabled"
            @click="save"
          >
            Save
          </button>
          <button
            class="btn btn-secondary"
            data-e2e-type="request-ppo-cancel-btn"
            @click="resetEditableFieldsToInitialValues"
            :disabled="isOfferActive"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./request-provider-pooling-offer.scss" scoped></style>

<script src="./request-provider-pooling-offer.js"></script>
