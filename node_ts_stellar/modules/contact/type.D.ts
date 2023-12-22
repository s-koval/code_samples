import Contact from "../../db/models/contact.model";
import User from "../../db/models/user.model";
import {ControllerApi} from "../../types/api.D";

export interface IContact {
  name?: string,
  email?: string,
  phone?: string,
  avatar?: string
};

export interface IContactService {
  create: (user: User, newContacts: IContact[]) => Promise<Contact[]>
  get: (user: User) => Promise<Contact[]>
  update: (user: User, contactId: Contact['id'], data: any) => Promise<any>
  delete: (user: User, contactId: Contact['id']) => Promise<void>
  find: (user: User, value: string) => Promise<Contact[]>
}

export interface IContactController {
  create: ControllerApi,
  get: ControllerApi,
  update: ControllerApi,
  delete: ControllerApi,
  find: ControllerApi
}