// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'https://api4.binance.com',
  websocketUrl: 'wss://stream.binance.com:9443/ws/${symbol}@kline_${timePeriod}'
};
