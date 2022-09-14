import { AxiosResponse } from 'axios';
import { AxiosDataFetcher } from '@sitecore-jss/sitecore-jss-nextjs';
import * as https from 'https';
/**
 * Implements a data fetcher using Axios - replace with your favorite
 * SSR-capable HTTP or fetch library if you like. See HttpDataFetcher<T> type
 * in sitecore-jss library for implementation details/notes.
 * @param {string} url The URL to request; may include query string
 * @param {unknown} data Optional data to POST with the request.
 */
export function dataFetcher<ResponseType>(
  url: string,
  data?: unknown
): Promise<AxiosResponse<ResponseType>> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
  return new AxiosDataFetcher({
    httpsAgent,
  }).fetch<ResponseType>(url, data);
}
