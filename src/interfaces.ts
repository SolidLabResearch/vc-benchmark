import {PathLike} from "node:fs";
import {AbstractImplementation} from "./suite-implementations/AbstractImplementation";

import {AbstractExperiment} from "./experiment/AbstractExperiment";
import {PerformanceEntry} from "node:perf_hooks";
import {IPerformanceOptions} from "./experiment";

export interface IRegistry {
  clear(): void
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

export enum DisclosureFormat {
  custom,
  frame,
  jsonpath
}

export interface ICredentialSetup {
  key: string
  credential: PathLike
  disclosureDocument: PathLike
  disclosureFormat: DisclosureFormat
  meta?: any
}

export type ConcreteImplementationConstructor = new (...args: any[]) => AbstractImplementation;

export type SubclassOfAbstractExperiment<T extends AbstractExperiment> = new (...args: any[]) => T;

export interface IRunResult {
  records: PerformanceEntry[]
  nRecords: number
  cryptosuite: string
  implementationClass: string
  iteration?: number
  start?: number
  end?: number
  credentialSetupKey: string
  nrCredentialSubjectAttributes: number
  nrDisclosedCredentialSubjectAttributes?: number
}

export interface IExperiment {
  cryptosuite: string
  credentialSetup: ICredentialSetup
  r: IRegistry
  ctrImp: ConcreteImplementationConstructor

  run: () => Promise<IRunResult>
  _run: () => Promise<any>;
  perfOptions: IPerformanceOptions
}
