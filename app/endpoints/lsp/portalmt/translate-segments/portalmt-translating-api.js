const _ = require('lodash');
const AxiosBasedApi = require('../../../axios-based-api');

const _mockTranslation = modelName => [
  'En el África subsahariana, se espera que las suscripciones a teléfonos móviles aumenten a 623 millones para 2025.',
  'Pero solo el 39% de sus ciudadanos tienen acceso a un teléfono inteligente hoy en día.',
  'Además, cerca de 1.700 millones de adultos en todo el mundo todavía no están bancarios, lo que significa que no tienen acceso a ningún servicio bancario digital.',
  'Esta exclusión digital crea desconexiones, problemas socioeconómicos, un bloqueo económico y la falta de acceso al crédito y otros servicios financieros.',
  'La plataforma Pay on Demand está diseñada para acelerar la inclusión digital resolviendo de manera holística los retos de la financiación de dispositivos y consiguiendo que más ciudadanos accedan a teléfonos inteligentes.',
  'Esta solución une a las instituciones financieras, los fabricantes de equipos originales y los telcos para prestar servicios a los infrautilizados en los mercados emergentes.',
  'El pago a la demanda proporciona acceso a los productos y servicios cotidianos para los consumidores, las microempresas, las pequeñas y medianas empresas (MIPYME), al tiempo que impulsa la inclusión.',
  'El panorama actual del mercado ofrece una oportunidad considerable para la empresa5 al conectar a más de 1 700 millones de adultos a bancos y servicios financieros, especialmente en las poblaciones móviles primeras.',
  'Sabemos que los consumidores de estas comunidades a menudo no pueden costear el coste de un teléfono inteligente, por lo que las soluciones de pago accesibles son un motor clave porque les permiten pagar hacia el dispositivo.',
  'Con el pago a la demanda, los prestamistas, los telcos y los OEM pueden tomar decisiones inteligentes y establecer un control razonable sobre cómo prestan.',
  'Además, al integrarse sin interrupciones con las API de pago a la demanda, ayudamos a impulsar la eficiencia, la toma de decisiones óptima y la escala.',
].map(segment => `${modelName} ${segment}`);
const _mockSuggestions = modelName => ['Este es un ejemplo de una frase.', 'Estees un ejemplo de una frase.', 'Este ejemplo es una frase.', 'Este constituye un ejemplo de frase.', 'Este se trata de un ejemplo de frase.', 'Este un ejemplo de una frase.', 'Este será un ejemplo de una frase.', 'Este fue un ejemplo de una frase.', 'Este representa un ejemplo de frase.', 'Este último es un ejemplo de frase.'].map(suggestion => `${suggestion} ${modelName}_${_.random(0, 100)}`);

class PortalMTTranslationApi extends AxiosBasedApi {
  constructor({ logger, user, configuration }) {
    const { PORTALMT_BASE_URL } = configuration.environment;
    super(logger, Object.assign({ user, configuration }, { baseUrl: PORTALMT_BASE_URL }));
  }
  async getTranslation({ source, sourceLang, targetLang, model, sessionID }) {
    const url = '/translate';
    const body = {
      source,
      source_language: sourceLang.toLowerCase(),
      target_language: targetLang.toLowerCase().replace('-', '_'),
      model_names: [model],
      session_id: sessionID,
      do_not_translate: '(&lt;.*?&gt;|<.*?>|\\{\\})+',
    };
    const response = await this.post(url, body);
    return {
      translations: _.get(response, 'data.results[0].translations', []),
      mtNode: _.get(response, 'headers.mt-node', ''),
    };
  }
  async getTranslationSuggestions({ source, prefix, sourceLang, targetLang, models, sessionID }) {
    const url = '/auto-suggest';
    const body = {
      source,
      prefix,
      source_language: sourceLang.toLowerCase(),
      target_language: targetLang.toLowerCase().replace('-', '_'),
      model_names: models,
      session_id: sessionID,
      do_not_translate: '(&lt;.*?&gt;|<.*?>|\\{\\})+',
    };
    const response = await this.post(url, body);
    return {
      suggestions: _.get(response, 'data.results', []),
      mtNode: _.get(response, 'headers.mt-node', ''),
    };
  }
  mockGetTranslation({ source, model }) {
    const translations = _mockTranslation(model);
    return {
      translations: source.map((v, index) => translations[index % translations.length]),
      mtNode: 'mock-translations',
    };
  }
  mockGetTranslationSuggestions({ models }) {
    return {
      suggestions: models.map(modelName => ({
        model_name: modelName,
        model_version: `${modelName}-0.0.1`,
        translation: _mockSuggestions(modelName),
      })),
      mtNode: 'mock-suggestions',
    };
  }
}
module.exports = PortalMTTranslationApi;
