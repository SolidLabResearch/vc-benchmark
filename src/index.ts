import keypair from './resources/zkp-ld/keypair.json';
import credentialBbsTermwiseSignature2023 from './resources/zkp-ld/vc0.json'
import disclosed from './resources/zkp-ld/disclosed0.json'
import credentialEd25519Signature2020 from './resources/ed25519-signature-2020/vc.json'
import dataIntegrity from '@digitalbazaar/data-integrity-context';
import {logv2} from "./utils/log";
import {createDocumentLoader, defaultContexts} from "./documentLoader";
import assert from "node:assert";
import {
  _Implementation_BbsBlsSignature2020,
  Implementation_BbsBlsSignature2020
} from "./suite-implementations/bbs-bls-signature-2020";
import {IRegistry, IVerificationMethod} from "./interfaces";
import {performance} from "node:perf_hooks";
import * as fs from "node:fs";
import {Implementation_Ed25519Signature2020} from "./suite-implementations/ed255-signature-2020";
import {Implementation_BbsTermwiseSignature2023} from "./suite-implementations/bbs-termwise-signature-2023";
import {klona} from "klona";
// @ts-ignore // TODO: refactor /resources to rootDir (/src)
import {derivationFrame, unsigned} from "./resources/bbs-bls-signature-2020/demo-pseudonymity/data";
import path from "node:path";
// @ts-ignore // TODO: fix
import {credential as mockCredentialEd25519} from "./resources/ed25519-signature-2020/mock-data";
import {Implementation_EcdsaSd2023Cryptosuite} from "./suite-implementations/ecdsa-sd-2023-cryptosuite";
import {unsignedCredential as unsignedCredentialEcdsaSd2023} from "./resources/ecdsa-sd-2023/data";

export const MARKERS = {
  START_SIGN_VC: 'START_SIGN_VC',
  END_SIGN_VC: 'END_SIGN_VC',
  START_VERIFY_VC: 'START_VERIFY_VC',
  END_VERIFY_VC: 'END_VERIFY_VC',
  START_DERIVE: 'START_DERIVE',
  END_DERIVE: 'END_DERIVE',
  START_VERIFY_DERIVED: 'START_VERIFY_DERIVED',
  END_VERIFY_DERIVED: 'END_VERIFY_DERIVED',
}


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

/**
 * zkpld: bbs-termwise-signature-2023
 */
namespace zkpld {
  export const cryptosuite: string = 'bbs-termwise-signature-2023'

  export function redactControllerDoc(doc: any) {
    let redactedDoc = klona(doc)
    delete redactedDoc['verificationMethod']['secretKeyMultibase']
    return redactedDoc
  }

  export async function main() {
    const credential = credentialBbsTermwiseSignature2023;
    const r = new MyRegistry()

    const controllerDoc = zkpld.redactControllerDoc(keypair)
    registerControllerDocumentAtRegistry(controllerDoc, r)

    const dl = createDocumentLoader(defaultContexts, r)

    const implBbsTermwiseSignature2023 = new Implementation_BbsTermwiseSignature2023(dl)
    const perfOptions = {
      detail: {
        implementation: 'bbs-termwise-signature-2023'
      }
    }
    console.log(`▶️${perfOptions.detail.implementation}`)

    // Sign VC
    console.log('>>> SIGN VC')
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const vc = await implBbsTermwiseSignature2023.sign(credential, keypair)
    performance.mark(MARKERS.END_SIGN_VC, perfOptions)
    assert(vc.proof.cryptosuite === cryptosuite)


    // Verify VC
    console.log('>>> VERIFY VC')
    performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
    const verificationResult = await implBbsTermwiseSignature2023.verify(vc)
    performance.mark(MARKERS.END_VERIFY_VC, perfOptions)
    assert(verificationResult.verified === true)

    // Derive VC
    console.log('>>> DERIVE VC')
    performance.mark(MARKERS.START_DERIVE, perfOptions)
    const vp = await implBbsTermwiseSignature2023.derive(vc, disclosed)
    performance.mark(MARKERS.END_DERIVE, perfOptions)

    // Verify VP with derived VC
    console.log('>>> VERIFY VP (DERIVED VC)')
    performance.mark(MARKERS.START_VERIFY_DERIVED, perfOptions)
    const verificationResultVp = await implBbsTermwiseSignature2023.verifyVP(vp)
    performance.mark(MARKERS.END_VERIFY_DERIVED, perfOptions)
    assert(verificationResultVp.verified === true)

    // Clear registry
    r.clear()
  }
}

namespace bbsSignature2020 {

  export const cryptosuite: string = 'bbs-bls-signature-2020'

  export const contextsToExclude = [
    'https://www.w3.org/ns/data-integrity/v1'
  ]

  export function getCredential() {
    // return credentialBbsTermwiseSignature2023;
    // OPTION 2
    return unsigned;
  }

  export function getDisclosed() {
    return derivationFrame
  }

  export async function main() {
    const r = new MyRegistry()
    const perfOptions = {
      detail: {
        implementation: 'BbsBlsSignature2020'
      }
    }
    console.log(`▶️${perfOptions.detail.implementation}`)
    // Create issuer keypair
    const controller: string = 'did:example:test-bbs-signature-2020'
    const kp = await _Implementation_BbsBlsSignature2020.createKeypair({
      seed: Uint8Array.from(
        Buffer.from('s3cr3t', 'base64')
      ),
      controller,
      id: 'did:example:test-bbs-signature-2020#g2'
    })


    const vm: IVerificationMethod = {
      type: 'BbsBlsSignature2020',
      id: kp.id!,
      controller: kp.controller!,
      publicKeyBase58: kp.publicKey,
    }

    const controllerDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: kp.controller!,
      verificationMethod: [vm],
      assertionMethod: [vm.id]
    }

    // Register controller document and public keypair material
    r.register(controller, controllerDocument)
    r.register(vm.id, vm)

    // Create documentloader that supports registry lookups
    const preprocessedContexts = Object.fromEntries(
      Object.entries(defaultContexts)
        .filter((pair) => !bbsSignature2020.contextsToExclude.includes(pair[0]))
    )

    const dl = createDocumentLoader(preprocessedContexts, r)

    // Instantiate implementation
    const implBbsBlsSignature2020 = new Implementation_BbsBlsSignature2020(dl)

    // Preprocess VC
    const credential = getCredential()
    const preprocessedCredential = _Implementation_BbsBlsSignature2020.preprocessVC(credential)


    // Sign VC
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const vc = await implBbsBlsSignature2020.sign(preprocessedCredential, kp)
    performance.mark(MARKERS.END_SIGN_VC, perfOptions)

    // Verify VC
    performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
    const verificationResult = await implBbsBlsSignature2020.verify(vc)
    performance.mark(MARKERS.END_VERIFY_VC, perfOptions)
    assert(verificationResult.verified === true)

    console.log('>>> DERIVE VC')
    // Preprocess disclosed document
    let preprocessedDisclosed = klona(getDisclosed())
    preprocessedDisclosed['@context'] = preprocessedDisclosed['@context'].filter((c) => (typeof c === "string") && !bbsSignature2020.contextsToExclude.includes(c))
    performance.mark(MARKERS.START_DERIVE, perfOptions)
    let dvc = await implBbsBlsSignature2020.deriveVC(vc, preprocessedDisclosed,)
    performance.mark(MARKERS.END_DERIVE, perfOptions)

    console.log('>>> VERIFY DERIVED VC')
    performance.mark(MARKERS.START_VERIFY_DERIVED, perfOptions)
    const verificationResultDerivedVC = await implBbsBlsSignature2020.verifyDerived(dvc)
    performance.mark(MARKERS.END_VERIFY_DERIVED, perfOptions)
    assert(verificationResultDerivedVC.verified === true)

    // Clear registry
    r.clear()
  }

}

namespace ed25519Signature2020 {

  export const cryptosuite: string = 'ed25519-signature-2023'
  export const contextsToInclude = [ // TODO: CLEAN UP COMMENTED-OUT CONTEXTS
    'https://www.w3.org/2018/credentials/v1',
    // 'https://schema.org/',
    // 'https://w3id.org/security/multikey/v1',
    'https://www.w3.org/ns/did/v1',
    // 'https://zkp-ld.org/context.jsonld',
    // 'https://www.w3.org/ns/data-integrity/v1',
    // 'https://w3id.org/security/bbs/v1',
    // 'https://w3id.org/security/suites/jws-2020/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    // 'https://w3id.org/security/v1',
    // 'https://w3id.org/security/v2',
    // 'https://w3id.org/citizenship/v1'

  ]

  export const getCredential = () => credentialEd25519Signature2020
  export const getMockCredential = () => mockCredentialEd25519

  export const getDisclosed = bbsSignature2020.getDisclosed // TODO

  export async function main() {

    const perfOptions = {
      detail: {
        implementation: 'Ed25519Signature2020'
      }
    }
    console.log(`▶️${perfOptions.detail.implementation}`)
    const r = new MyRegistry()
    const controller = 'did:example:test-ed25519-signature-2020'

    // Create keypair
    // const kp = await Implementation_Ed25519Signature2020.createKeypair(controller, seedString)
    const kp = await Implementation_Ed25519Signature2020.createKeypairV2(controller)

    const vm = {
      id: kp.id!,
      controller: kp.controller!,
      publicKeyMultibase: kp.publicKeyMultibase!
    }

    const controllerDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      type: kp.type,
      id: kp.controller!,
      verificationMethod: [vm],
      assertionMethod: [vm.id]
    }

    // Register controller document and public keypair material
    r.register(controller, controllerDocument)
    r.register(vm.id, vm)
    // Create documentloader that supports registry lookups
    const preprocessedContexts = Object.fromEntries(
      Object.entries(defaultContexts)
        .filter((pair) => ed25519Signature2020.contextsToInclude.includes(pair[0]))
    )

    const dl = createDocumentLoader(preprocessedContexts, r)

    // VC: preprocess
    const credential = ed25519Signature2020.getMockCredential()
    const preprocessedCredential = Implementation_Ed25519Signature2020.preprocessVC(credential)

    console.log('>>> SIGN VC')
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const vc = await Implementation_Ed25519Signature2020.sign(preprocessedCredential, kp, dl)
    performance.mark(MARKERS.END_SIGN_VC, perfOptions)

    console.log('>>> VERIFY VC')
    performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
    const verificationResult = await Implementation_Ed25519Signature2020.verifySignedCredential(vc, dl)
    performance.mark(MARKERS.END_VERIFY_VC, perfOptions)
    assert(verificationResult.verified === true)

    // Clear registry
    r.clear()
  }
}

namespace ecdsaSd2023Cryptosuite {
  export const cryptosuite: string = 'ecdsa-sd-2023-cryptosuite'

  export function getCredential() {
    return klona(unsignedCredentialEcdsaSd2023);
  }

  export async function main() {
    console.log(`Cryptosuite: ${cryptosuite}`)
    const perfOptions = {detail: {implementation: ecdsaSd2023Cryptosuite.cryptosuite}}
    console.log(`▶️${perfOptions.detail.implementation}`)
    const controller = 'did:example:test-ecdsa-sd-2023';

    // Registry
    const r = new MyRegistry();

    // Keypair
    const kp = await Implementation_EcdsaSd2023Cryptosuite.createKeypair(controller)

    // Register the signatory's public key at registry r
    const kpExport = await kp.export({publicKey: true, includeContext: true})
    const vm: IVerificationMethod = {
      // TODO: fix TS2353: Object literal may only specify known properties, and '@context' does not exist in type IVerificationMethod
      // @ts-ignore
      '@context': 'https://w3id.org/security/multikey/v1',
      type: 'Multikey',
      id: kpExport.id,
      controller: kpExport.controller,
      publicKeyMultibase: kpExport.publicKeyMultibase,
    }
    r.register(vm.id, vm)

    // Register signatory's corresponding controller document
    const controllerDocEcdsaMultikey = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/multikey/v1'
      ],
      id: kpExport.controller,
      assertionMethod: [vm.id]
    };
    r.register(controllerDocEcdsaMultikey.id, controllerDocEcdsaMultikey)

    // Documentloader
    const contexts = {
      ...defaultContexts,
      [dataIntegrity.DATA_INTEGRITY_CONTEXT_V2_URL]: dataIntegrity.CONTEXT
    }
    const dl = createDocumentLoader(contexts, r)

    // Instantiate implementation
    const impl = new Implementation_EcdsaSd2023Cryptosuite(dl)

    // Credential (unsigned)
    let credential = klona(ecdsaSd2023Cryptosuite.getCredential())
    credential['issuer'] = controllerDocEcdsaMultikey.id;

    // Sign credential
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const signedCredential = await impl.sign(credential, kp)
    performance.mark(MARKERS.END_SIGN_VC, perfOptions)

    // Verify signed credential
    performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
    const verificationResult = await impl.verifySignedCredential!(signedCredential)
    assert(verificationResult.verified === true)
    performance.mark(MARKERS.END_VERIFY_VC, perfOptions)


    // Derive credential
    const selectivePointers = ['/credentialSubject/id']
    performance.mark(MARKERS.START_DERIVE, perfOptions)
    const derivedCredential = await impl.derive(signedCredential, selectivePointers)
    performance.mark(MARKERS.END_DERIVE, perfOptions)

    // Verify (derived) credential
    performance.mark(MARKERS.START_VERIFY_DERIVED, perfOptions)
    const derivedVerificationResult = await impl.verify(derivedCredential)
    performance.mark(MARKERS.END_VERIFY_DERIVED, perfOptions)
    assert(derivedVerificationResult.verified === true)

    // Clear registry
    r.clear()

  }
}

async function printPerformanceRecords() {
  const records = performance.getEntries();
  // logv2(records, 'performanceRecords')
  const r0 = records[0]

  const r0Detail = {...r0.detail!} as Record<string, any>
  console.log('r0Detail.implementation: ', r0Detail.implementation)


  const fnameSuffix = r0Detail.implementation
  const fnameTimestamp = `${Math.floor(Date.now() / 1000)}`

  const fname = `performanceRecords_${fnameSuffix}_${fnameTimestamp}.json`
  console.log(`Writing performance record: ${fname}`)
  fs.writeFileSync(path.join('data', fname), JSON.stringify(performance.getEntries()))

}

/**
 * INVOKE ALL IMPLEMENTATION RUNNERS ITERATIVELY
 */
const implementationRunners = [
  zkpld,
  bbsSignature2020,
  ed25519Signature2020,
  ecdsaSd2023Cryptosuite
]
// Promise.all(implementationRunners.map(ir => ir.main()))
//   .then(printPerformanceRecords).catch(logv2)
/*
async function runSequentially(implementationRunners: any[]) {
  const funcs = implementationRunners.map(ir => ir.main)
  for (const func of funcs) {
    await func();
    await printPerformanceRecords()
    performance.clearMarks()
  }
}

async function runExperiment() {
  const N = 2
  let errors = []
  for(let i = 0; i < N; i++) {
    try {
      await runSequentially(implementationRunners)
    } catch(err) {
      errors.push({error: err, i})
    }
  }
  if(errors.length > 0) {
    console.error(`A total of ${errors.length} occurred!`)
    fs.writeFileSync(path.join('data', 'errors.json'), JSON.stringify(errors))
  }
}

runExperiment().then().catch(console.error)*/

/**
 * SEPARATE IMPLEMENTATION RUNS
 */
// zkpld.main().then(printPerformanceRecords).catch(logv2)
// bbsSignature2020.main().then(printPerformanceRecords).catch(logv2)
// ed25519Signature2020.main().then(printPerformanceRecords).catch(logv2)
// ecdsaSd2023Cryptosuite.main().then(printPerformanceRecords).catch(logv2)

/**
 * V2 RUN EXPERIMENT BATCH
 * 04/01/2025
 */
async function runBatch(n: number) {
  const batchTimestamp = Math.floor(Date.now() / 1000)

  let errors = []
  for await (const i of implementationRunners) {
    console.log(`🅰️crypto suite: ${i.cryptosuite}`)
    const cs = Object(i).cryptosuite as string

    for (let j = 0; j < n; j++) {
      console.log(`\t🅱️ iteration j: ${j}`)
      const experimentTag = `${cs}-${j}`
      try {
        // Clear any existing performance records
        performance.clearMarks()

        // Execute implementation i for the j-th time
        await i.main()

        // Export performance records
        const records = performance.getEntries();
        console.log('n records: ', records.length)
        const dataToExport = {
          records,
          nRecords: records.length,
          experimentTag,
          iteration: j,
          batchTimestamp
        }

        const fname = `performanceRecords_${batchTimestamp}_${experimentTag}.json`
        fs.writeFileSync(path.join('data', fname), JSON.stringify(dataToExport))

      } catch (e) {
        console.error(`Error occurred (iteration: ${j}/${n - 1})`, e)
        errors.push({error: e, experimentTag, iteration: j, n})
      }
    }
  }
  if (errors.length > 0) {
    console.error(`A total of ${errors.length} errors occurred!`)
    fs.writeFileSync(path.join('data', 'errors.json'), JSON.stringify(errors))
  } else {
    console.log('No errors occurred!')
  }
}

const batchSize = 2
runBatch(batchSize).then().catch(console.error)
/**
 * DEV
 */
// ecdsaSd2023Cryptosuite.main().then().catch(console.error)
