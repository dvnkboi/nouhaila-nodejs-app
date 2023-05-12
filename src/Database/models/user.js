import { mysqlInstance } from "../connector.js";
import { config } from 'dotenv';
import { hash, compare } from "bcrypt";

config();

export class User {
  constructor(email, password, name = '', age = 0, phone = '', privilege = 'user') {
    this.email = email;
    this.password = password;
    this.name = name;
    this.age = age;
    this.phone = phone;
    this.privilege = privilege;
  }

  async save() {
    const exists = await mysqlInstance.getMatching('user', 'email', this.email, true);
    this.password = await hash(this.password, 10);

    if (exists && exists.length > 0) {
      //encrypt password
      await mysqlInstance.update('user', 'email', this.email, {
        name: this.name,
        password: this.password,
        privilege: this.privilege,
        age: this.age,
        phone: this.phone,
      });
      return this;
    }
    await mysqlInstance.insert('user', {
      name: this.name,
      email: this.email,
      password: this.password,
      privilege: this.privilege,
      age: this.age,
      phone: this.phone,
    });

    return this;
  }

  async get() {
    const exists = await mysqlInstance.getMatching('user', 'email', this.email, true);
    if (exists && exists.length > 0) {
      this.email = exists.email;
      this.name = exists.name;
      this.age = exists.age;
      this.phone = exists.phone;
      this.privilege = exists.privilege;
      this.password = exists.password;
      return this;
    }
    return null;
  }

  async remove() {
    const exists = await mysqlInstance.getMatching('user', 'email', this.email, true);
    if (exists && exists.length > 0) {
      await mysqlInstance.delete('user', 'email', this.email);
      return true;
    }
    return false;
  }

  static async get(email) {
    const exists = await mysqlInstance.getMatching('user', 'email', email, true);
    if (exists && exists.length > 0) {
      return new User(exists[0].email, exists[0].password, exists[0].name, exists[0].age, exists[0].phone, exists[0].privilege);
    }
    return null;
  }

  static async getAll() {
    const exists = await mysqlInstance.getAll('user');
    if (exists && exists.length > 0) {
      const users = [];
      for (const user of exists) {
        users.push(new User(user.email, user.password, user.name, user.age, user.phone, user.privilege));
      }
      return users;
    }
    return null;
  }

  static async remove(email) {
    const exists = await mysqlInstance.getMatching('user', 'email', email, true);
    if (exists && exists.length > 0) {
      await mysqlInstance.remove('user', 'email', email);
      return true;
    }
    return false;
  }

  static async exists(email) {
    const exists = await mysqlInstance.getMatching('user', 'email', email, true);
    if (exists && exists.length > 0) {
      return true;
    }
    return false;
  }

  async checkPassword(password) {
    return await compare(password, this.password);
  }
}