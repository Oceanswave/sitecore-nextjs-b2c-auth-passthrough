import {
  LayoutService,
  RestLayoutServiceConfig,
  LayoutServiceData,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { IncomingMessage, ServerResponse } from 'http';

/**
 * Fetch layout data using the Sitecore Layout Service REST API.
 * Uses Axios as the default data fetcher (@see AxiosDataFetcher).
 */
export class AuthenticatedRestLayoutService implements LayoutService {
  private serviceConfig: RestLayoutServiceConfig;

  constructor(serviceConfig: RestLayoutServiceConfig) {
    this.serviceConfig = serviceConfig;
    /**
     * Provides default @see AxiosDataFetcher data fetcher
     * @param {IncomingMessage} [req] Request instance
     * @param {ServerResponse} [res] Response instance
     * @returns default fetcher
     */
    this.getDefaultFetcher = (req, res) => {
      const config = {
        debugger: debug.layout,
      };
      if (req && res) {
        config.onReq = this.setupReqHeaders(req);
        config.onRes = this.setupResHeaders(res);
      }
      const axiosFetcher = new AxiosDataFetcher(config);
      const fetcher = (url, data) => {
        return axiosFetcher.fetch(url, data);
      };
      return fetcher;
    };
  }
  /**
   * Provides fetch options in order to fetch data
   */
  protected getFetchParams(language?: string | undefined): FetchOptions {
    let _a;
    return {
      sc_apikey: this.serviceConfig.apiKey,
      sc_site: this.serviceConfig.siteName,
      sc_lang: language || '',
      tracking: (_a = this.serviceConfig.tracking) !== null && _a !== void 0 ? _a : true,
    };
  }

  /**
   * Fetch layout data for an item.
   */
  fetchLayoutData(
    itemPath: string,
    language?: string,
    req?: IncomingMessage,
    res?: ServerResponse
  ): Promise<LayoutServiceData> {
    const querystringParams = this.getFetchParams(language);
    debug.layout(
      'fetching layout data for %s %s %s',
      itemPath,
      language,
      this.serviceConfig.siteName
    );
    const fetcher = this.serviceConfig.dataFetcherResolver
      ? this.serviceConfig.dataFetcherResolver(req, res)
      : this.getDefaultFetcher(req, res);
    const fetchUrl = this.resolveLayoutServiceUrl('render');
    return fetchData(fetchUrl, fetcher, Object.assign({ item: itemPath }, querystringParams)).catch(
      (error) => {
        let _a;
        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
          // Aligned with response of GraphQL Layout Service in case if layout is not found.
          // When 404 Rest Layout Service returns
          // {
          //   sitecore: {
          //     context: {
          //       pageEditing: false,
          //       language
          //     },
          //     route: null
          //   },
          // }
          //
          return error.response.data;
        }
        throw error;
      }
    );
  }
  /**
   * Fetch layout data for a particular placeholder.
   * Makes a request to Sitecore Layout Service for the specified placeholder in
   * a specific route item. Allows you to retrieve rendered data for individual placeholders instead of entire routes.
   * @param {string} placeholderName
   * @param {string} itemPath
   * @param {string} [language]
   * @param {IncomingMessage} [req] Request instance
   * @param {ServerResponse} [res] Response instance
   * @returns {Promise<PlaceholderData>} placeholder data
   */
  fetchPlaceholderData(placeholderName, itemPath, language, req, res) {
    const querystringParams = this.getFetchParams(language);
    debug.layout(
      'fetching placeholder data for %s %s %s %s',
      placeholderName,
      itemPath,
      language,
      this.serviceConfig.siteName
    );
    const fetcher = this.serviceConfig.dataFetcherResolver
      ? this.serviceConfig.dataFetcherResolver(req, res)
      : this.getDefaultFetcher(req, res);
    const fetchUrl = this.resolveLayoutServiceUrl('placeholder');
    return fetchData(
      fetchUrl,
      fetcher,
      Object.assign({ placeholderName, item: itemPath }, querystringParams)
    );
  }
  /**
   * Resolves layout service url
   * @param {string} apiType which layout service API to call ('render' or 'placeholder')
   * @returns the layout service url
   */
  resolveLayoutServiceUrl(apiType) {
    const { apiHost = '', configurationName = 'jss' } = this.serviceConfig;
    return `${apiHost}/sitecore/api/layout/${apiType}/${configurationName}`;
  }
  /**
   * Setup request headers
   * @param {IncomingMessage} req
   * @returns {AxiosRequestConfig} axios request config
   */
  setupReqHeaders(req) {
    return (reqConfig) => {
      debug.layout('performing request header passing');
      reqConfig.headers.common = Object.assign(
        Object.assign(
          Object.assign(
            Object.assign(
              Object.assign({}, reqConfig.headers.common),
              req.headers.cookie && { cookie: req.headers.cookie }
            ),
            req.headers.referer && { referer: req.headers.referer }
          ),
          req.headers['user-agent'] && { 'user-agent': req.headers['user-agent'] }
        ),
        req.connection.remoteAddress && { 'X-Forwarded-For': req.connection.remoteAddress }
      );
      return reqConfig;
    };
  }
  /**
   * Setup response headers based on response from layout service
   * @param {ServerResponse} res
   * @returns {AxiosResponse} response
   */
  setupResHeaders(res) {
    return (serverRes) => {
      debug.layout('performing response header passing');
      serverRes.headers['set-cookie'] &&
        res.setHeader('set-cookie', serverRes.headers['set-cookie']);
      return serverRes;
    };
  }
}
