import {IContactService} from "../type.D";
import {Api404Error} from "../../../helper/error";
import Contact from "../../../db/models/contact.model";
import {Op} from "sequelize";

const contactService: IContactService = {
  create: async function (user, newContacts) {
    if (!user) throw new Api404Error('User not found');
    const contacts = await Promise.all(newContacts.map(async (newContact) => {
      const contact = await Contact.create({...newContact, userId: user.id});
      return contact
    }));
    return contacts;
  },
  get:    async function (user) {
    if (!user) throw new Api404Error('User not found');
    const contacts = await Contact.findAll({where: {userId: user.id}});
    return contacts
  },
  update: async function (user, contactId, data) {
    if (!user) throw new Api404Error('User not found');
    const contact = await Contact.update(data, {where: {id: contactId, userId: user.id}});
    return contact
  },
  delete: async function (user, contactId) {
    if (!user) throw new Api404Error('User not found');
    await Contact.destroy({where: {id: contactId, userId: user.id}});
  },
  find:   async function (user, value) {
    if (!user) throw new Api404Error('User not found');
    const contacts = await Contact.findAll({
      where: {
        userId:  user.id,
        [Op.or]: [
          {email: {[Op.iLike]: `%${decodeURIComponent(value)}%`}},
          {phone: {[Op.iLike]: `%${decodeURIComponent(value)}%`}},
          {name: {[Op.iLike]: `%${decodeURIComponent(value)}%`}}
        ]
      }
    });
    return contacts
  },
};

export default contactService;