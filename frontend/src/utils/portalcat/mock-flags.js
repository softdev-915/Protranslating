import _ from 'lodash';

const mockFlags = ['mockRepetitions', 'mockLockingFailed'];

export default {
  interceptor(request) {
    const urlQueryParams = new URLSearchParams(window.location.search);
    mockFlags.forEach((flag) => {
      const flagValue = urlQueryParams.get(flag);
      if (!_.isNil(flagValue)) {
        request.headers.set(`lms-${flag}`, flagValue);
      }
    });
    return request;
  },
};
