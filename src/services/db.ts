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
  price: number;
}

export class AppDB extends Dexie {
  account!: Table<Account, number>;
  transactions!: Table<Transaction, number>;

  constructor() {
    super('db');
    this.version(4).stores({
      account: '++id',
      transactions: '++id',
    });
    this.on('populate', () => this.populate());
  }

  async populate() {
    await db.account.add({
      walletMoney: 50,
      walletCoins: 0,
      timestamp: new Date().getTime()
    });
  }
}

export const db = new AppDB();
