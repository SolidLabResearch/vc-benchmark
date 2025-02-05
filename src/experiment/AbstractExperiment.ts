import {
  ConcreteImplementationConstructor,
  DisclosureFormat,
  ICredentialSetup,
  IExperiment,
  IRegistry,
  IRunResult
} from "../interfaces";
import {readJsonFile} from "../utils/io";
import {MyRegistry} from "../MyRegistry";
import {logv2} from "../utils/log";
import {IPerformanceOptions} from "../experiment";
import path from "node:path";
import fs from 'fs'
import {performance} from "node:perf_hooks";
import {countAttributes, objVistor} from "../utils/misc";

export abstract class AbstractExperiment implements IExperiment {
  credentialSetup: ICredentialSetup;
  public cryptosuite: string;
  r: IRegistry
  ctrImp: ConcreteImplementationConstructor;
  perfOptions: IPerformanceOptions;
  public credential: any
  public disclosureDocument: any
  public disclosureFormat: DisclosureFormat

  constructor(credentialSetup: ICredentialSetup, cryptosuite: string, ctrImp: ConcreteImplementationConstructor) {
    this.credentialSetup = credentialSetup;
    this.credential = readJsonFile(credentialSetup.credential.toString())
    this.disclosureDocument = readJsonFile(credentialSetup.disclosureDocument.toString())
    this.disclosureFormat = credentialSetup.disclosureFormat
    this.cryptosuite = cryptosuite;
    this.r = new MyRegistry()
    this.ctrImp = ctrImp;
    this.perfOptions = {
      detail: {
        implementation: this.cryptosuite
      }
    }
  }


  /**
   * Number of credentialSubject attributes
   */
  get nrCredentialSubjectAttributes() : number {
    let nrAttributes = countAttributes(this.credential.credentialSubject)
    return nrAttributes
  }

  /**
   * Number of credentialSubject attributes being disclosed.
   * NOTE: Currently, this only works when the disclosure format is a JSON-LD Frame.
   */
  get nrDisclosedCredentialSubjectAttributes(): number {
    if(this.disclosureFormat != DisclosureFormat.frame)
      throw new Error('Currently, nrDisclosedCredentialSubjectAttributes can only be computed when the disclosure format is a JSON-LD Frame.')

    let nrDisclosedAttributes = 0;
    // visitor function that counts the number of disclosed attributes (i.e., empty objects -> {})
    const vf = (k: string, o: object) => {
      if (typeof o === "object" && Object.keys(o).length === 0) {
        nrDisclosedAttributes ++;
      }
    }
    objVistor(this.disclosureDocument.credentialSubject, vf)
    return nrDisclosedAttributes
  }

  async run(): Promise<IRunResult> {
    performance.clearMarks();
    await this._run();
    const records = performance.getEntries();

    const nrDisclosedCredentialSubjectAttributes = this.disclosureFormat === DisclosureFormat.frame ? this.nrDisclosedCredentialSubjectAttributes : undefined
    return {
      records,
      nRecords: records.length,
      cryptosuite: this.cryptosuite,
      implementationClass: this.ctrImp.name,
      credentialSetupKey: this.credentialSetup.key,
      nrCredentialSubjectAttributes: this.nrCredentialSubjectAttributes,
      nrDisclosedCredentialSubjectAttributes
    }
  }

  abstract _run(): Promise<any>;

  log(obj: any, tag: string | undefined = undefined) {
    if (!!tag)
      console.log(`[${this.cryptosuite}] ${tag}`)
    else
      console.log(`[${this.cryptosuite}]`)

    logv2(obj)
  }

  exportObject(obj: any, tag: string): any {
    const outputDir = path.resolve('temp', 'output', this.cryptosuite)
    const fpathExport = path.resolve(outputDir, `${tag}.json`)
    this.log(fpathExport, '[EXPORT]')
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(fpathExport, JSON.stringify(obj, null, 2))
  }
}
