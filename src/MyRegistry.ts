import {IRegistry} from "./interfaces";
import {logv2} from "./utils/log";

export class MyRegistry implements IRegistry {
  private db;

  constructor() {
    this.db = new Map();
  }

  register(id: string, doc: object): void {
    console.log(`Registering: ${id}`)
    this.db.set(id, doc);
  }

  resolve(id: string): object {
    console.log(`Resolving: ${id}`)
    if (!this.db.has(id))
      throw new Error(`${id} not registered!`)
    const doc = this.db.get(id);
    logv2(doc, 'doc')
    return doc
  }

  getIds(): string[] {
    return Array.from(this.db.keys())
  }

  clear() {
    this.db.clear()
  }
}
