import {
  ConcreteImplementationConstructor,
  DisclosureFormat,
  ICredentialSetup, IExperiment,
  IRegistry,
  IRunResult
} from "../interfaces";
import {readJsonFile} from "../utils/io";
import {MyRegistry} from "../MyRegistry";
import {logv2} from "../utils/log";
import {IPerformanceOptions} from "../experiment";

export abstract class AbstractExperiment implements IExperiment {
  credentialSetup: ICredentialSetup;
  public cryptosuite: string;
  r: IRegistry;
  ctrImp: ConcreteImplementationConstructor;
  perfOptions: IPerformanceOptions;
  credential: any
  disclosureDocument: any
  disclosureFormat: DisclosureFormat

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


  async run(): Promise<IRunResult> {
    performance.clearMarks();
    await this._run();
    const records = performance.getEntries();
    return {
      records,
      nRecords: records.length,
      cryptosuite: this.cryptosuite,
      implementationClass: this.ctrImp.name,
      credentialSetupKey: this.credentialSetup.key
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
}
