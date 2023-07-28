import { Component, OnInit } from '@angular/core';
import { keys } from '../environments/s';
import { WebsocketService } from 'src/services/websocket.service';
import { environment } from 'src/environments/environment';

import { liveQuery } from 'dexie';
import { db, Account, Transaction } from '../services/db';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [WebsocketService]
})
export class AppComponent implements OnInit {
  title = 'binance-bot';
  wsUrl = environment.websocketUrl;
  periods = ['1s', '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
  symbol = 'soleur';
  period = '1s';

  accountLatest: Account = {
    id: 0,
    walletMoney: 0,
    walletCoins: 0,
    timestamp: 0
  };

  accounts: Account[] = [];

  fee = 1 / 100;
  sellMinGainPercentage = 2 / 100;
  buyMinGainPercentage = 2 / 100;

  rsiPeriod = 14;
  rsiOverbought = 70;
  rsiOversold = 30;

  buyPrice = 0;
  buyPercent = .5;

  closingPrices: number[] = [];

  transactions: Transaction[] = [];

  constructor(private websocketService: WebsocketService) {
    let account = liveQuery(() => db.account.toArray());
    account.subscribe(acc => {
      let accLatest = acc[acc.length - 1];
      if (!acc.length) return;
      this.accountLatest.id = accLatest.id;
      this.accountLatest.walletCoins = accLatest.walletCoins;
      this.accountLatest.walletMoney = accLatest.walletMoney;
      this.accountLatest.timestamp = accLatest.timestamp;
    });

    let transactions = liveQuery(() => db.transactions.toArray());
    transactions.subscribe(tr => {
      this.transactions = tr;
    });
  }

  async ngOnInit() {

  }

  connectToStream() {
    this.closingPrices = [];
    if (!this.symbol || !this.period) alert('Symbol and Period are required!');

    this.websocketService.connect(this.wsUrl.replace('${symbol}', this.symbol).replace('${timePeriod}', this.period)).subscribe((msg: any) => {
      this.processData(msg);
    });
  }

  async processData(data: any) {
    if (!data) return;

    let candle = data['k'];
    let isCandleClosed = candle['x'];
    let closePrice = +candle['c'];

    this.buyPrice = closePrice;

    if (isCandleClosed) {
      this.closingPrices.push(closePrice);
      console.log(this.closingPrices);

      let rsi = 0;

      if (this.closingPrices.length + 1 >= this.rsiPeriod) {
        this.closingPrices.shift();
        rsi = this.calculateRSI(this.closingPrices)
        console.log('rsi', rsi);
      } else {
        return;
      }

      let buyTransactions = this.transactions.filter(t => t.type === 'buy');
      let averageBuyPrice = buyTransactions[buyTransactions.length - 1]?.price || 0;//buyTransactions.map(t => t.price).reduce((a, b) => a + b, 0) / buyTransactions.length || 0;

      let sellTransactions = this.transactions.filter(t => t.type === 'sell');
      let averageSellPrice = sellTransactions[sellTransactions.length - 1]?.price || closePrice;//sellTransactions.map(t => t.price).reduce((a, b) => a + b, 0) / sellTransactions.length || closePrice;

      if (rsi < this.rsiOversold
        && this.accountLatest.walletMoney > 10) {
        //&& averageSellPrice - averageSellPrice * this.buyMinGainPercentage < averageSellPrice) {
        console.log('bought at: ', closePrice);

        this.accountLatest.walletCoins = (this.accountLatest.walletMoney / closePrice) * this.buyPercent;

        await db.account.add({
          timestamp: new Date().getTime(),
          walletMoney: this.accountLatest.walletMoney - this.accountLatest.walletMoney * this.buyPercent,
          walletCoins: this.accountLatest.walletCoins - this.accountLatest.walletCoins * this.fee
        });

        await db.transactions.add({
          timestamp: new Date().getTime(),
          symbol: this.symbol,
          type: 'buy',
          closedPrice: closePrice,
          quantity: this.accountLatest.walletCoins - this.accountLatest.walletCoins * this.fee,
          price: closePrice,
        });

        console.log('wallet coins (SOL): ', this.accountLatest.walletCoins);
      } else
        if (rsi > this.rsiOverbought
          && this.accountLatest.walletCoins > 0) {
          //&& closePrice - closePrice * this.sellMinGainPercentage > averageBuyPrice) {
          console.log('sold at: ', closePrice);

          this.accountLatest.walletMoney = closePrice * this.accountLatest.walletCoins;
          // this.wallet.walletMoney = this.wallet.walletMoney - this.wallet.walletMoney * this.fee;
          // this.wallet.walletCoins = 0;

          await db.account.add({
            timestamp: new Date().getTime(),
            walletMoney: this.accountLatest.walletMoney - this.accountLatest.walletMoney * this.fee,
            walletCoins: 0
          });

          await db.transactions.add({
            timestamp: new Date().getTime(),
            symbol: this.symbol,
            type: 'sell',
            closedPrice: closePrice,
            quantity: this.accountLatest.walletMoney - this.accountLatest.walletMoney * this.fee,
            price: closePrice,
          });

          console.log('wallet money (E): ', this.accountLatest.walletMoney);
        }

    }
  }

  private calculateRSI(closingPrices: number[]) {
    // Calculate the average of the upward price changes
    let avgUpwardChange = 0;
    for (let i = 1; i < closingPrices.length; i++) {
      avgUpwardChange += Math.max(0, this.closingPrices[i] - this.closingPrices[i - 1]);
    }
    avgUpwardChange /= closingPrices.length;

    // Calculate the average of the downward price changes
    let avgDownwardChange = 0;
    for (let i = 1; i < closingPrices.length; i++) {
      avgDownwardChange += Math.max(0, this.closingPrices[i - 1] - this.closingPrices[i]);
    }
    avgDownwardChange /= closingPrices.length;

    // Calculate the RSI
    const rsi = 100 - (100 / (1 + (avgUpwardChange / avgDownwardChange)));

    return rsi || 0;
  }
}
