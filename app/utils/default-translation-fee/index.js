const defaultFee = currencies =>
  currencies.reduce((fee, currency) => {
    fee[currency.isoCode] = 0;
    return fee;
  }, {});

module.exports = {
  defaultFee,
};

