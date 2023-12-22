import User from "../../db/models/user.model";
import StellarAccount from "../../db/models/stellar_account";
import {Horizon} from "stellar-sdk";
import StellarInvoice from "../../db/models/stellar_invoice";
import {ControllerApi} from "../../types/api.D";

export interface IStellarAccountService {
  create: (user: User, publicKey: string, accountName: string) => Promise<StellarAccount>
  update: (user: User, accountId: StellarAccount['id'], data: any ) => Promise<any>
  delete: (user: User, accountId: StellarAccount['id'] ) => Promise<any>
  find: (data: any ) => Promise<StellarAccount[]>
  getPublicKeyFromAccount: (accountId: string ) => Promise<StellarAccount['publicKey']>
  getBalance: (publicKey: string ) => Promise<Horizon.BalanceLine[]>
  checkOwnerAccount: (user: User, accountId: string ) => Promise<StellarAccount | null>
  updateDefaultAccount: (user: User, accountId: string ) => Promise<any>
}

export interface IStellarInvoiceService {
  create: (data: any) => Promise<StellarInvoice>
  update: (id: StellarInvoice['id'], data: any) => Promise<any>
  get: (invoiceId: StellarInvoice['id'], userId: User['id']) => Promise<StellarInvoice>
  find: (where: any) => Promise<StellarInvoice[]>
}

export interface IStellarTransactionService{
  saveTransaction: (data: any) => Promise<any>
  findTransaction: (findTransaction: any) => Promise<any>
  getTransactionsHistory: (accountId: StellarAccount['id'], userId: User['id'], query: any) => Promise<any>
}

export interface IStellarController{
  createStellarAccount: ControllerApi
  updateStellarAccount: ControllerApi
  updateStellarDefaultAccount: ControllerApi
  deleteStellarAccount: ControllerApi
  getStellarAccounts: ControllerApi
  getBalance: ControllerApi
  findStrictReceivePaymentPaths: ControllerApi
  createTransaction: ControllerApi
  getTransactionsHistory: ControllerApi
  findTransaction: ControllerApi
  createInvoice: ControllerApi
  getInvoice: ControllerApi
  updateInvoice: ControllerApi
  getExchangeRate: ControllerApi
}