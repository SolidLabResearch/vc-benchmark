import keypair from '../resources/zkp-ld/keypair.json';
import credentialBbsTermwiseSignature2023 from '../resources/zkp-ld/vc0.json'
import credential from '../resources/vc0.json';
import disclosed from '../resources/zkp-ld/vc0.json';

import {logv2} from "./utils/log";
import {keyGen, sign, verify} from "@zkp-ld/jsonld-proofs";
import {createDocumentLoader, defaultContexts, defaultDocumentLoader} from "./documentLoader";
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

export const MARKERS = {
  START_SIGN_VC: 'START_SIGN_VC',
  END_SIGN_VC: 'END_SIGN_VC',
  START_VERIFY_VC: 'START_VERIFY_VC',
  END_VERIFY_VC: 'END_VERIFY_VC',
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
}

export function registerControllerDocumentAtRegistry(controllerDoc: any, r: IRegistry) {
  // Register controller doc
  r.register(controllerDoc.id, controllerDoc)

  // Register verification method's pub key
  let { verificationMethod } = controllerDoc
  let vmDoc = {
    '@context': controllerDoc['@context'],
    verificationMethod,
  }
  r.register(verificationMethod.id, vmDoc)
}

namespace zkpld {
  const cryptosuite: string = 'bbs-termwise-signature-2023'

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

    // Sign VC
    console.log('>>> SIGN VC')
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const vc = await implBbsTermwiseSignature2023.sign(credential, keypair)
    performance.mark(MARKERS.END_SIGN_VC, perfOptions)
    // logv2(vc, 'vc')
    assert(vc.proof.cryptosuite === cryptosuite)


    // Verify VC
    console.log('>>> VERIFY VC')
    performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
    const verificationResult = await implBbsTermwiseSignature2023.verify(vc)
    performance.mark(MARKERS.END_VERIFY_VC, perfOptions)
    logv2(verificationResult, 'verificationResult')
    assert(verificationResult.verified === true)

    // console.log('Derive VC')
    // const vp = await // TODO
    // logv2(vp, 'vp (derived)')
  }
}

namespace bbsSignature2020 {

  export async function main() {
    const r = new MyRegistry()
    const perfOptions = {
      detail: {
        implementation: 'BbsBlsSignature2020'
      }
    }
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
    const dl = createDocumentLoader(defaultContexts, r)

    // Instantiate implementation
    const implBbsBlsSignature2020 = new Implementation_BbsBlsSignature2020(dl)

    // Preprocess VC
    const preprocessedCredential = _Implementation_BbsBlsSignature2020.preprocessVC(credential)
    // Sign VC
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const vc = await implBbsBlsSignature2020.sign(preprocessedCredential, kp)
    performance.mark(MARKERS.END_SIGN_VC, perfOptions)
    // logv2(vc, 'vc')

    performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
    const verificationResult = await _Implementation_BbsBlsSignature2020.verify(vc, dl)
    performance.mark(MARKERS.END_VERIFY_VC, perfOptions)
    // logv2(verificationResult, 'verificationResult')
    assert(verificationResult.verified === true)

    // Derive VC
    // console.log('Derive VC')
    // const vp = await Implementation_BbsBlsSignature2020.derive(vc, disclosed)
    // logv2(vp, 'vp (derived)')

  }

}

namespace ed25519Signature2020 {


  export async function main() {
    const perfOptions = {
      detail: {
        implementation: 'Ed25519Signature2020'
      }
    }
    const r = new MyRegistry()
    const controller = 'did:example:test-ed25519-signature-2020'
    const seedString = 'super-secretive-seed-of-at-least-32-bytes'


    // Create keypair
    const kp = await Implementation_Ed25519Signature2020.createKeypair(controller, seedString)

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
    const dl = createDocumentLoader(defaultContexts, r)

    // VC: preprocess
    const preprocessedCredential = Implementation_Ed25519Signature2020.preprocessVC(credential)
    // VC: sign
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const vc = await Implementation_Ed25519Signature2020.sign(
      preprocessedCredential,
      kp,
      dl
    )
    performance.mark(MARKERS.END_SIGN_VC, perfOptions)

    // VC: verify
    performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
    const verificationResult = await Implementation_Ed25519Signature2020.verify(vc, dl)
    performance.mark(MARKERS.END_VERIFY_VC, perfOptions)

    // logv2(verificationResult, 'verificationResult')
    assert(verificationResult.verified === true)


  }
}

async function printPerformanceRecords() {
  logv2(performance.getEntries(), 'performanceRecords')
  fs.writeFileSync('performanceRecords.json', JSON.stringify(performance.getEntries()))

}

/**
 * INVOKE ALL IMPLEMENTATION RUNNERS ITERATIVELY
 */
const implementationRunners = [
  zkpld,
  bbsSignature2020,
  ed25519Signature2020
]
Promise.all(implementationRunners.map(ir => ir.main()))
  .then(printPerformanceRecords).catch(logv2)


/**
 * SEPARATE IMPLEMENTATION RUNS
 */
// zkpld.main().then(printPerformanceRecords).catch(logv2)
// bbsSignature2020.main().then(printPerformanceRecords).catch(logv2)
// ed25519Signature2020.main().then(printPerformanceRecords).catch(logv2)

