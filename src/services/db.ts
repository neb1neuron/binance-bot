import Dexie, { Table } from 'dexie';

export interface Account {
  id?: number;
  walletMoney: number;
  walletCoins: number;
  timestamp: number;
}

export interface Transaction {
  id?: number;
  timestamp: number;
  symbol: string;
  type: string;
  closedPrice: number;
  quantity: number;
  transactionPrice: number;
  isActive: boolean;
}

export interface BuyCounter {
  id?: number;
  value: number;
}

export class AppDB extends Dexie {
  account!: Table<Account, number>;
  transactions!: Table<Transaction, number>;
  buyCounter!: Table<BuyCounter, number>;

  constructor() {
    super('db');
    this.version(6).stores({
      account: '++id',
      transactions: '++id',
      buyCounter: '++id',
    });
    this.on('populate', () => this.populate());
  }

  async populate() {
    await db.account.add({
      walletMoney: 1000,
      walletCoins: 0,
      timestamp: new Date().getTime()
    });
    await db.buyCounter.add({
      value: 0,
    })
  }
}

export const db = new AppDB();
