import {
  LayoutService,
  GraphQLLayoutService,
  RestLayoutService,
  AxiosDataFetcher,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { AxiosResponse } from 'axios';
import * as https from 'https';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';
import config from 'temp/config';

function dataFetcher<T>(
  url: string,
  data?: unknown,
  session?: Session | null
): Promise<AxiosResponse<T>> {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  return new AxiosDataFetcher({
    httpsAgent,
    headers: {
      Authorization: `Bearer ${session?.id_token}`,
    },
  }).fetch<T>(url, data);
}

export class LayoutServiceFactory {
  create(): LayoutService {
    switch (process.env.FETCH_WITH) {
      case 'GraphQL':
        return new GraphQLLayoutService({
          endpoint: config.graphQLEndpoint,
          apiKey: config.sitecoreApiKey,
          siteName: config.jssAppName,
        });
      default:
        const rest = new RestLayoutService({
          apiHost: config.sitecoreApiHost,
          apiKey: config.sitecoreApiKey,
          siteName: config.jssAppName,
          dataFetcherResolver: (req) => {
            return (url: string, data?: unknown) => {
              return getSession({ req }).then((session) => {
                return dataFetcher(url, data, session);
              });
            };
          },
          configurationName: 'default',
        });
        return rest;
    }
  }
}

export const layoutServiceFactory = new LayoutServiceFactory();
