<template>
  <table class="table table-sm table-stacked table-bordered table-striped text-center">
    <thead class="hidden-xs-down">
      <tr>
        <th>Currency</th>
        <th class="text-center">Invoice<br>Balance</th>
        <th class="text-center">Consolidated<br>Invoice<br>Balance</th>
        <th class="text-center">Credit<br>Memo<br>Available</th>
        <th class="text-center">Consolidated<br>Credit<br>Memo<br>Available</th>
        <th class="text-center">Debit<br>Memo<br>Available</th>
        <th class="text-center">Consolidated<br>Debit<br>Memo<br>Available</th>
        <th class="text-center">Advance<br>Payment<br>Available</th>
        <th class="text-center">Consolidated<br>Advance<br>Payment<br>Available</th>
        <th class="text-center">Total<br>Balance</th>
        <th class="text-center">Consolidated<br>Total<br>Balance</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row of balance"
        :key="row._id"
        data-e2e-type="company-balance-info-row"
      >
        <td>
          <b class="hidden-sm-up">Currency:</b>
          <div data-e2e-type="company-balance-info-row-currency">
            {{ row.currency }}
          </div>
        </td>
        <td>
          <b class="hidden-sm-up">Invoice Balance:</b>
          <div data-e2e-type="company-balance-info-row-balance">
            {{ row.invoice.own.toFixed(2) }}
          </div>
        </td>
         <td>
          <b class="hidden-sm-up">Invoice Consolidated Balance:</b>
           <div data-e2e-type="company-balance-info-row-consolidated-balance">
             {{ row.invoice.consolidated.toFixed(2) }}
           </div>
        </td>
        <td>
          <b class="hidden-sm-up">Credit Memo Available:</b>
          <div data-e2e-type="company-balance-info-row-credit-memo">
            {{ row.credit.own.toFixed(2) }}
          </div>
        </td>
        <td>
          <b class="hidden-sm-up">Consolidated Credit Memo Available:</b>
          <div data-e2e-type="company-balance-info-row-consolidated-credit-memo">
            {{ row.credit.consolidated.toFixed(2) }}
          </div>
        </td>
        <td>
          <b class="hidden-sm-up">Debit Memo Available:</b>
          <div data-e2e-type="company-balance-info-row-debit-memo">
            {{ row.debit.own.toFixed(2) }}
          </div>
        </td>
         <td>
          <b class="hidden-sm-up">Consolidated Debit Memo Available:</b>
           <div data-e2e-type="company-balance-info-row-consolidated-debit-memo">
             {{ row.debit.consolidated.toFixed(2) }}
           </div>
        </td>
        <td>
          <b class="hidden-sm-up">Advance Payment Available:</b>
          <div data-e2e-type="company-balance-info-row-payment-available">
            {{ row.advance.own.toFixed(2) }}
          </div>
        </td>
         <td>
          <b class="hidden-sm-up">Consolidated Advance Payment Available:</b>
           <div data-e2e-type="company-balance-info-row-consolidate-payment-available">
             {{ row.advance.consolidated.toFixed(2) }}
           </div>
        </td>
        <td>
          <b class="hidden-sm-up">Total Balance:</b>
          <div data-e2e-type="company-balance-info-row-total-balance">
            {{ row.balance.toFixed(2) }}
          </div>
        </td>
        <td>
          <b class="hidden-sm-up">Consolidated Total Balance:</b>
          <div data-e2e-type="company-balance-info-row-consolidated-total-balance">
            {{ row.consolidatedBalance.toFixed(2) }}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script src="./balance-information.js"></script>
