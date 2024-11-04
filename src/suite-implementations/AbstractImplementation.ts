import {IImplementation} from "../interfaces";

export abstract class AbstractImplementation implements IImplementation {
  documentLoader: any


  constructor(documentLoader: any) {
    this.documentLoader = documentLoader;
  }

  abstract sign(credential: any, key: any): Promise<any>
  abstract verify(vc: any): Promise<any>
}
