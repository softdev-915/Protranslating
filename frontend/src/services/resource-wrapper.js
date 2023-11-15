const resourceWrapper = (resourcePromise, showBlurLoading = true) => {
  if (showBlurLoading) {
    window.store.dispatch('app/triggerGlobalEvent', { blurLoading: true });
  }
  return resourcePromise
    .then((response) => response.body)
    .catch((response) => {
      if (response.body && response.body.status) {
        const resp = { ...response.body };
        resp.__original__ = response;
        return Promise.reject(resp);
      }
      return Promise.reject(response);
    })
    .finally(() => {
      if (showBlurLoading) {
        window.store.dispatch('app/triggerGlobalEvent', { blurLoading: false });
      }
    });
};

export default resourceWrapper;
