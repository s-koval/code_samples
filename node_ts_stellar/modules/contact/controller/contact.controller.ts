import {IContactController} from "../type.D";
import {Api403Forbidden, Api404Error} from "../../../helper/error";
import contactService from "../service/contact.service";

const contactController: IContactController = {
  create: async (req, res) => {
    try {
      const user = req.user
      if (!user) throw new Api404Error('User not found');
      const newContacts = req.body;
      const contacts = await contactService.create(user, newContacts);
      return res.status(200).json(contacts);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  get:    async (req, res) => {
    try {
      const user = req.user
      if (!user) throw new Api404Error('User not found');
      const contacts = await contactService.get(user);
      return res.status(200).json(contacts);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  update: async (req, res) => {
    try {
      const user = req.user
      if (!user) throw new Api404Error('User not found');
      const {contactId} = req.params;
      if (!contactId) throw new Api404Error('Contact id not found');
      const contact = await contactService.update(user, contactId, req.body);
      return res.status(200).json(contact);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  delete: async (req, res) => {
    try {
      const user = req.user
      if (!user) throw new Api404Error('User not found');
      const {contactId} = req.params;
      if (!contactId) throw new Api404Error('Contact id not found');
      await contactService.delete(user, contactId);
      return res.status(200)
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
  find:   async (req, res) => {
    try {
      const user = req.user
      if (!user) throw new Api404Error('User not found');
      const {value} = req.query;
      if (value && typeof value !== "string") throw new Api403Forbidden('Incorrect query parameter');
      const contacts = await contactService.find(user, value || '');
      return res.status(200).json(contacts);
    } catch (err: any) {
      const code = err?.statusCode || 500
      return res.status(code).json(err);
    }
  },
};

export default contactController;