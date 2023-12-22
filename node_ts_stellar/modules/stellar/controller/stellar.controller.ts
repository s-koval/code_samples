import {accountService} from "../service/account.service";
import {IStellarController} from "../types.D";
import {paymentService} from "../service/payment.service";
import {transactionService} from "../service/transaction.service";
import {invoiceService} from "../service/invoice.service";

export const stellarController: IStellarController = {
  createStellarAccount:          async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).json('user not found');
    const {name, publicKey} = req.body;
    try {
      const newAccount = await accountService.create(user, publicKey, name);
      return res.status(200).json(newAccount);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  updateStellarAccount:          async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).json('user not found');
    const {accountId} = req.params;
    try {
      const account = await accountService.update(user, accountId, req.body);
      return res.status(200).json(account);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  updateStellarDefaultAccount:   async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).json('user not found');
    const {accountId} = req.params;
    try {
      const account = await accountService.updateDefaultAccount(user, accountId);
      return res.status(200).json(account);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  deleteStellarAccount:          async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).json('user not found');
    const {accountId} = req.params;
    try {
      const account = await accountService.delete(user, accountId);
      return res.status(200).json(account);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  getStellarAccounts:            async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).json('user not found');
    try {
      const accounts = await accountService.find({userId: user.id});
      return res.status(200).json(accounts);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  getBalance:                    async (req, res) => {
    try {
      const {accountId, pk} = req.query as {accountId?: string, pk?: string};
      let publicKey = pk ? pk : await accountService.getPublicKeyFromAccount(accountId || '');
      const result = await accountService.getBalance(publicKey);
      return res.status(200).json(result);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  findStrictReceivePaymentPaths: async (req, res) => {
    try {
      const {sourceAsset, destinationAmount, destinationAsset} = req.body;
      const result = await paymentService.findStrictReceivePaymentPaths({
        sourceAsset,
        destinationAmount,
        destinationAsset,
      });
      return res.status(200).json(result);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  createTransaction:             async (req, res) => {
    try {
      const {invoiceId, ...transactionData} = req.body;
      const result = await transactionService.saveTransaction(transactionData);
      if (invoiceId) {
        await invoiceService.update(invoiceId, {completed: true});
      }
      return res.status(200).json(result);
    } catch (err: any) {
      console.log('err', err)
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  getTransactionsHistory:        async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(404).json('user not found');
      const {accountId} = req.params;
      const checkAccountOwner = await accountService.checkOwnerAccount(user, accountId);
      if (!checkAccountOwner) return res.status(500).json('Account not found');
      const result = await transactionService.getTransactionsHistory(accountId, user.id, req.query);
      return res.status(200).json(result);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  findTransaction:               async (req, res) => {
    try {
      const {hash} = req.query;
      const result = await transactionService.findTransaction({hash});
      return res.status(200).json(result);
    } catch (err: any) {
      console.log('err', err)
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  createInvoice:                 async (req, res) => {
    try {
      const data = req.body;
      const user = req.user;
      if (!user) return res.status(404).json('user not found');
      const newInvoice = await invoiceService.create({receiverId: user.id, ...data});
      res.status(200).json(newInvoice);
    } catch (err: any) {
      console.log('err :>> ', err);
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  getInvoice:                    async (req, res) => {
    try {
      const {invoiceId} = req.params;
      const user = req.user;
      if (!user) return res.status(404).json('user not found');
      const newInvoice = await invoiceService.get(invoiceId, user.id);
      res.status(200).json(newInvoice);
    } catch (err: any) {
      console.log('err :>> ', err);
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  updateInvoice:                 async (req, res) => {
    try {
      const data = req.body;
      const {invoiceId} = req.params;
      const updatedInvoice = await invoiceService.update(invoiceId, data);
      res.status(200).json(updatedInvoice);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  getExchangeRate: async (req, res) => {
    try {
      const { currency, convertCurrency, amount } = req.query;
      if(!currency || !convertCurrency || !amount) throw new Error('Invalid query parameters')
      const result = await paymentService.getExchangeRate(currency.toString(), convertCurrency.toString(), amount.toString())
      return res.status(200).json(result)
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
};