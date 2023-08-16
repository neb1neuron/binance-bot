import { Component, OnInit } from '@angular/core';
import { keys } from '../environments/s';
import { WebsocketService } from 'src/services/websocket.service';
import { environment } from 'src/environments/environment';

import { liveQuery } from 'dexie';
import { db, Account, Transaction } from '../services/db';
import { EmailService } from 'src/services/email.service';
import { ChartDataModel } from './types/chart.data.model';
import { FileReaderService } from 'src/services/file-reader.service.ts.service';

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
  period = this.periods[0];
  isRunning = true;
  sendEmail = false;

  data: ChartDataModel[] = [];

  accountLatest: Account = {
    id: 0,
    walletMoney: 1000,
    walletCoins: 0,
    timestamp: new Date().getTime()
  };

  accounts: Account[] = [];

  currentClosePrice = 0;
  fee = 1 / 1000;
  sellMinGainPercentage = 5 / 1000;
  buyMinGainPercentage = 2 / 1000;

  buyMaxPrice = 22;
  sellTargetProfit = 1 / 100;
  lastSellPrice = 0;

  rsiPeriod = 14;
  rsiOverbought = 90;
  rsiOversold = 30;

  averageBuyPrice = 0;
  buyPercent = .1;
  maxBuyRoundsDefault = 14;
  maxBuyRounds = this.maxBuyRoundsDefault;
  intervalInSeconds = 1;

  closingPrices: number[] = [];

  transactions: Transaction[] = [];
  // buyTransactions: Transaction[] = [];

  constructor(private websocketService: WebsocketService,
    private emailService: EmailService,
    private fileReaderService: FileReaderService) {
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

  currentTime = 0;

  async ngOnInit() {
    this.initiate();
  }

  async readLocalCsv() {
    const fileContent = await this.fileReaderService.readLocalFile('../assets/SOLEUR-Jan 2022-Jul 2023 v2.csv');
    let csvToRowArray = fileContent.split("\n");
    let closePrices: { t: number, o: number, c: number, h: number, l: number }[] = [];
    //for (let index = 1; index < csvToRowArray.length - 1; index++) {
    for (let index = 0; index < csvToRowArray.length - 1; index++) {
      if (!csvToRowArray[index]) continue;
      let row = csvToRowArray[index].split(",");
      // t,o,h,l,c
      //closePrices.push({ t: +row[0], o: +row[1], h: +row[2], l: +row[3], c: +row[4] });
      // if (new Date(+row[0]) >= new Date('01/01/2023')) {// && new Date(+row[0]) <= new Date('07/01/2023')) {
      if (new Date(+row[0]) >= new Date('03/01/2023') && new Date(+row[0]) <= new Date('04/01/2023')) {
        this.currentClosePrice = +row[4];
        this.currentTime = +row[0];
        await this.checkTrade({ t: +row[0], o: +row[1], h: +row[2], l: +row[3], c: +row[4] });
      }
    }
    console.log(this.transactions);
  }

  startPriceService() {
    this.initiate();
  }

  stopPriceService() {
    this.websocketService.disconnect();
  }

  initiate() {
    this.closingPrices = [];
    if (!this.symbol || !this.period) alert('Symbol and Period are required!');

    let round = 0;
    this.websocketService.connect(this.wsUrl.replace('${symbol}', this.symbol).replace('${timePeriod}', this.period)).subscribe((data: any) => {
      let candle = data ? data['k'] : null;

      this.fee++;



      if (candle) {
        this.currentClosePrice = +candle['c'];


        let isCandleClosed = candle['x'];
        if (!isCandleClosed) return;

        if (this.isRunning) {
          this.checkTrade(candle);
        }
        round = 0;
      }
    });
  }

  transactionTypes = {
    buy: 'buy',
    sell: 'sell'
  }

  stop() {
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
  }

  async checkTrade(candle: any) {
    let closePrice = +candle['c'];
    this.closingPrices.push(closePrice);

    let rsi = 0;

    // this.data.push({
    //   date: candle['t'],
    //   open: candle['o'],
    //   close: candle['c'],
    //   high: candle['h'],
    //   low: candle['l'],
    //   volume: 0
    // });
    // this.data = [...this.data];


    // first buy
    if (this.transactions.length === 0) {
      this.buy();
    }

    if (this.closingPrices.length > this.rsiPeriod) {
      this.closingPrices.shift();
      this.data.shift();
      rsi = this.calculateRSI(this.closingPrices)
    } else {
      // return;
    }

    let buyTransactionsTotalPrice: number = 0;
    let activeBuyTransactions = this.transactions.filter(t => t.type === this.transactionTypes.buy && t.isActive);

    for (let i = this.transactions.length - 1; i >= 0; i--) {
      if (this.transactions[i].type === 'sell') {
        break;
      }
      buyTransactionsTotalPrice += this.transactions[i].closedPrice * this.transactions[i].quantity;
      activeBuyTransactions.push(this.transactions[i]);
    }


    this.averageBuyPrice = buyTransactionsTotalPrice / this.accountLatest.walletCoins || 0;

    let sellTransactions = this.transactions.filter(t => t.type === 'sell');
    let averageSellPrice = sellTransactions.map(t => t.transactionPrice).reduce((a, b) => a + b, 0) / sellTransactions.length || 0;

    let averagePrice = this.closingPrices.reduce((a, b) => a + b, 0) / this.closingPrices.length;

    let previousClosingPrice = this.closingPrices[this.closingPrices.length - 2];

    // check buy conditions
    if (this.maxBuyRounds > 0
      && this.accountLatest.walletMoney > 100
      //&& this.accountLatest.walletMoney + (this.accountLatest.walletCoins * this.averageBuyPrice) - (this.accountLatest.walletCoins * this.averageBuyPrice) * this.fee < 1100
      &&
      // (averagePrice + (averagePrice * this.fee) < closePrice)
      //   || (this.averageBuyPrice - (this.averageBuyPrice * this.fee) > closePrice))
      (averagePrice + (averagePrice * this.buyMinGainPercentage) + (averagePrice * this.fee) < closePrice)
      // && activeBuyTransactions[activeBuyTransactions.length - 1]?.closedPrice < closePrice
      // previousClosingPrice > closePrice &&
      && rsi > this.rsiOverbought
      // && this.lastSellPrice > closePrice
      // && (this.closingPrices[this.closingPrices.length - 2] >= closePrice)
      // && activeBuyTransactions[activeBuyTransactions.length - 2]?.closedPrice || 0 > closePrice
    ) {
      console.log('rsi', rsi);
      console.log('price difference:', closePrice - previousClosingPrice);
      console.log('averagePrice', averagePrice);
      console.log('averageBuyPrice', this.averageBuyPrice);
      console.log('lastSellPrice', sellTransactions[sellTransactions.length - 1]?.closedPrice || 0);
      console.log('bought #######################################################################################');

      this.buy();
    } else
      // check sell conditions
      if (this.accountLatest.walletCoins > 0
        // && this.averageBuyPrice + (this.averageBuyPrice * this.sellMinGainPercentage) + (this.averageBuyPrice * this.fee) < closePrice
        && this.averageBuyPrice + (this.averageBuyPrice * this.sellMinGainPercentage) + (this.averageBuyPrice * this.fee) < closePrice
        //&& this.accountLatest.walletMoney < 1100
        // && this.averageBuyPrice + (this.averageBuyPrice * this.sellMinGainPercentage) + (this.averageBuyPrice * this.fee) < closePrice
        // && rsi < 1
        && this.closingPrices[this.closingPrices.length - 2] > closePrice
      ) {

        this.sell();
        console.log('rsi', rsi);
        console.log('price difference:', closePrice - previousClosingPrice);
        console.log('averagePrice', averagePrice);
        console.log('averageBuyPrice', this.averageBuyPrice);
        console.log('lastSellPrice', sellTransactions[sellTransactions.length - 1]?.closedPrice || 0);
        console.log('sold #######################################################################################');
        // for (let index = 0; index < activeBuyTransactions.length; index++) {
        //   const buyTransaction = activeBuyTransactions[index];
        //   const buyPrice = buyTransaction.closedPrice;
        //   if (buyPrice + (buyPrice * this.sellMinGainPercentage) + (buyPrice * this.fee) < closePrice) {
        //     await this.sell(buyTransaction)
        //   }
        // }
        // activeBuyTransactions.forEach(buyTransaction => {
        //   const buyPrice = buyTransaction.closedPrice;
        //   if (buyPrice + (buyPrice * this.sellMinGainPercentage) + (buyPrice * this.fee) < closePrice) {
        //      this.sell(buyTransaction)
        //   }
        // });
      }
  }

  async sell(buyTransaction: Transaction | undefined = undefined) {
    let coinsBeforeSell = this.accountLatest.walletCoins;
    let soldCoinsPriceAfterFee = 0;
    let walletMoney = this.accountLatest.walletMoney;
    this.lastSellPrice = this.currentClosePrice;

    if (!buyTransaction) {

      this.maxBuyRounds = this.maxBuyRoundsDefault;

      coinsBeforeSell = this.accountLatest.walletCoins;
      soldCoinsPriceAfterFee = this.currentClosePrice * this.accountLatest.walletCoins - (this.currentClosePrice * this.accountLatest.walletCoins * this.fee);
      walletMoney = this.accountLatest.walletMoney + soldCoinsPriceAfterFee;

      // this.transactions.map(t => { if (t.type === this.transactionTypes.buy && t.isActive) t.isActive = false });

      // this.accountLatest = {
      //   walletMoney: walletMoney,
      //   walletCoins: 0,
      //   timestamp: new Date(this.currentTime).toLocaleString()
      // };

      // this.transactions.push({

      //   id: this.currentTime,
      //   symbol: this.symbol,
      //   type: 'sell',
      //   closedPrice: this.currentClosePrice,
      //   quantity: -1 * coinsBeforeSell,
      //   transactionPrice: soldCoinsPriceAfterFee,
      //   timestamp: new Date(this.currentTime).toLocaleString(),
      //   isActive: true
      // });

      //this.transactions = [...this.transactions];

      await db.transactions.where({ isActive: true }).modify({ isActive: false });
    } else {
      this.maxBuyRounds++;
      coinsBeforeSell = buyTransaction.quantity;
      soldCoinsPriceAfterFee = this.currentClosePrice * coinsBeforeSell - (this.currentClosePrice * coinsBeforeSell * this.fee);
      walletMoney = this.accountLatest.walletMoney + soldCoinsPriceAfterFee;

      await db.transactions.where({ id: buyTransaction.id }).modify({ isActive: false });
      //this.transactions.find(t => t.id === buyTransaction.id)!.isActive = false;

      //this.transactions = [...this.transactions];
    }

    await db.account.add({
      walletMoney: walletMoney,
      walletCoins: 0,
      timestamp: new Date().getTime()
    });

    await db.transactions.add({
      symbol: this.symbol,
      type: 'sell',
      closedPrice: this.currentClosePrice,
      quantity: -1 * coinsBeforeSell,
      transactionPrice: soldCoinsPriceAfterFee,
      timestamp: new Date().getTime(),
      isActive: true
    });

    this.emailService.send('SELL', `
      Sold Price: ${this.currentClosePrice} euro,
      Quantity: ${this.accountLatest.walletCoins},
      walletCoins: 0 SOLEUR,
      walletMoney: ${walletMoney} euro,
      time: ${new Date(this.currentTime).toLocaleString()}`, this.sendEmail);

    console.log('wallet money (E): ', walletMoney);
  }

  async buy() {
    this.lastSellPrice = 0;
    this.maxBuyRounds--;
    let buyCoinsPrice = this.accountLatest.walletMoney * (this.buyPercent);
    let buyCoinsPriceAfterFee = buyCoinsPrice - buyCoinsPrice * this.fee;

    let walletCoins = this.accountLatest.walletCoins + buyCoinsPriceAfterFee / this.currentClosePrice;

    let moneyAfterCurrentBuy = this.accountLatest.walletMoney - buyCoinsPrice;

    // this.accountLatest = {
    //   walletMoney: moneyAfterCurrentBuy,
    //   walletCoins: walletCoins,
    //   timestamp: new Date(this.currentTime).toLocaleString()
    // }
    await db.account.add({
      walletMoney: moneyAfterCurrentBuy,
      walletCoins: walletCoins,
      timestamp: new Date().getTime()
    });

    // this.transactions.push({
    //   id: this.currentTime,
    //   type: this.transactionTypes.buy,
    //   symbol: this.symbol,
    //   closedPrice: this.currentClosePrice,
    //   quantity: buyCoinsPriceAfterFee / this.currentClosePrice,
    //   transactionPrice: buyCoinsPrice,
    //   timestamp: new Date(this.currentTime).toLocaleString(),
    //   isActive: true
    // });

    // this.transactions = [...this.transactions];

    await db.transactions.add({
      type: this.transactionTypes.buy,
      symbol: this.symbol,
      closedPrice: this.currentClosePrice,
      quantity: buyCoinsPriceAfterFee / this.currentClosePrice,
      transactionPrice: buyCoinsPrice,
      timestamp: new Date().getTime(),
      isActive: true
    });

    this.emailService.send('BUY', `
      Bought Price: ${this.currentClosePrice} euro,
      Quantity: ${buyCoinsPriceAfterFee / this.currentClosePrice},
      walletCoins: ${walletCoins} SOLEUR,
      walletMoney: ${moneyAfterCurrentBuy} euro,
      time: ${new Date(this.currentTime).toLocaleString()}`, this.sendEmail);

    console.log('totalValue: ', moneyAfterCurrentBuy + (walletCoins * this.averageBuyPrice) - (walletCoins * this.averageBuyPrice) * this.fee);
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
