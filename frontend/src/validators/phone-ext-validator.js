export default {
  getMessage: (field) => `The ${field} is invalid`,
  validate: (value) => new Promise((resolve) => {
    const phoneExtRegex = new RegExp(/^[+]\d{1,3}$/);
    resolve({
      valid: value.match(phoneExtRegex),
      data: value,
    });
  }),
};

