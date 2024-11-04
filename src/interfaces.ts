export interface IRegistry {
  register(id: string, doc: object): void

  resolve(id: string): object

  getIds(): string[]
}


/**
 * https://www.w3.org/TR/did-core/#verification-method-properties
 */
export interface IVerificationMethod {
  id: string
  controller: string
  type: string
  publicKeyJwk?: object
  publicKeyMultibase?: string
  publicKeyBase58?: string
}

export interface IServiceEndpoint {
  id: string
  type: string | string[]
  serviceEndpoint: string | string[]
}

/**
 * https://www.w3.org/TR/did-core/#did-document-properties
 */
export interface IDidDocument {
  '@context': string | string[]
  id: string
  alsoKnownAs?: string | string[]
  controller?: string | string[]

  // Verification Methods
  verificationMethod?: (IVerificationMethod | string)[]
  authentication?: (IVerificationMethod | string)[]
  assertionMethod?: (IVerificationMethod | string)[]
  keyAgreement?: (IVerificationMethod | string)[]
  capabilityInvocation?: (IVerificationMethod | string)[]
  capabilityDelegation?: (IVerificationMethod | string)[]

  service?: (IServiceEndpoint | string)[]
}

export interface IImplementation {
  sign(credential: any, key: any): Promise<any>
  verify(vc: any): Promise<any>
}
