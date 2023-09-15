const { URL } = require('url');

class ServerURLFactory {
  constructor(configuration) {
    this.configuration = configuration;
    this._url = null;
  }

  buildServerURL() {
    if (!this._url) {
      const envConfig = this.configuration.environment;
      const host = envConfig.HTTP_HOST;
      const port = envConfig.HTTP_PORT.toString();
      // const isHttps = port.indexOf('443' >= 0);
      // sample url that will be overwritten
      const url = new URL('http://sample.com/');

      url.protocol = 'http';
      url.host = host;
      /* if (isHttps) {
        url.protocol = 'https';
      } */
      if (envConfig.NODE_ENV === 'DEV') {
        // only set the port if dev
        url.port = port;
      }
      this._url = url.href;
    }

    return this._url;
  }
}

module.exports = ServerURLFactory;
