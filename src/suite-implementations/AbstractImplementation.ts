import {IImplementation} from "../interfaces";

export abstract class AbstractImplementation implements IImplementation {
  documentLoader: any

  constructor(documentLoader: any) {
    this.documentLoader = documentLoader;
  }

  abstract derive(vc: any, disclosureDocument: any): Promise<any>
  abstract sign(credential: any, key: any): Promise<any>
  abstract verify(vc: any): Promise<any>
  abstract verifySignedCredential?(vc: any): Promise<any>
  abstract verifyDerivedCredential?(dvc: any): Promise<any>
  abstract verifyDerived?(d: any): Promise<any>


}
