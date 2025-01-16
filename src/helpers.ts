import {IRegistry} from "./interfaces";

export function registerControllerDocumentAtRegistry(controllerDoc: any, r: IRegistry) {
  // Register controller doc
  r.register(controllerDoc.id, controllerDoc)

  // Register verification method's pub key
  let {verificationMethod} = controllerDoc
  let vmDoc = {
    '@context': controllerDoc['@context'],
    verificationMethod,
  }
  r.register(verificationMethod.id, vmDoc)
}
