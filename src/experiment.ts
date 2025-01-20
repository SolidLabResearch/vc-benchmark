import {derivationFrame, unsigned} from "./resources/bbs-bls-signature-2020/demo-pseudonymity/data";
import {
  _Implementation_BbsBlsSignature2020,
  Implementation_BbsBlsSignature2020
} from "./suite-implementations/bbs-bls-signature-2020";
import {IVerificationMethod} from "./interfaces";
import {createDocumentLoader, defaultContexts} from "./documentLoader";
import {performance} from "node:perf_hooks";
import assert from "node:assert";
import {klona} from "klona";
import {unsignedCredential as unsignedCredentialEcdsaSd2023} from "./resources/ecdsa-sd-2023/data";
import {Implementation_EcdsaSd2023Cryptosuite} from "./suite-implementations/ecdsa-sd-2023-cryptosuite";
import dataIntegrity from "@digitalbazaar/data-integrity-context";
import credentialEd25519Signature2020 from "./resources/ed25519-signature-2020/vc.json";
import {credential as mockCredentialEd25519} from "./resources/ed25519-signature-2020/mock-data";
import {_Implementation_Ed25519Signature2020} from "./suite-implementations/ed255-signature-2020";
import keypair from "./resources/zkp-ld/keypair.json";
import {Implementation_BbsTermwiseSignature2023} from "./suite-implementations/bbs-termwise-signature-2023";
import {MyRegistry} from "./MyRegistry";
import {registerControllerDocumentAtRegistry} from "./helpers";
import {logv2} from "./utils/log";
import jsonld from "jsonld";

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

export interface IPerformanceOptions {
  detail: {
    implementation: string
  }
}

/**
 * zkpld: bbs-termwise-signature-2023
 */
export namespace zkpld {
  export const cryptosuite: string = 'bbs-termwise-signature-2023'

  export function redactControllerDoc(doc: any) {
    let redactedDoc = klona(doc)
    delete redactedDoc['verificationMethod']['secretKeyMultibase']
    return redactedDoc
  }

  export namespace preprocessing {
    export function addIssuer(doc: any, issuer: string) {
      doc['issuer'] = issuer
      return doc;
    }
    export function updateContext(doc: any) {
      if (!Array.isArray(doc['@context']))
        throw new Error('@context must be an array!')

      // Contexts: required
      const ctxRequired = [
        "https://www.w3.org/ns/data-integrity/v1",
      ]
      ctxRequired.forEach(c => {
        if (!doc['@context'].includes(c))
          doc['@context'].push(c);
      })

      // Contexts: to exclude
      const ctxToExclude = [
        'https://w3id.org/security/bbs/v1'
      ]
      doc['@context'] = doc['@context'].filter((c: any)=>!ctxToExclude.includes(c))

      return doc
    }

    export function addProofObject(doc: any): any {
      doc["proof"]= {
        '@context': "https://www.w3.org/ns/data-integrity/v1",
        "type": "DataIntegrityProof",
        "created": "2023-02-09T09:35:07Z",
        "cryptosuite": "bbs-termwise-signature-2023",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:example:issuer0#bls12_381-g2-pub001"
      }
      return doc
    }
  }


  export async function main(credential: string, disclosureDocument: string) {
    // const credential = credentialBbsTermwiseSignature2023;
    const r = new MyRegistry()

    const controllerDoc = zkpld.redactControllerDoc(keypair)
    registerControllerDocumentAtRegistry(controllerDoc, r)

    logv2(controllerDoc, 'controllerDoc')

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
    let preprocessedCredential = zkpld.preprocessing.addProofObject(credential)
    zkpld.preprocessing.updateContext(preprocessedCredential)
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const vc = await implBbsTermwiseSignature2023.sign(preprocessedCredential, keypair)
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

    // Preprocessing
    zkpld.preprocessing.addIssuer(vc, controllerDoc.id)
    let preprocessedDisclosureDocument = klona(disclosureDocument) as any
    zkpld.preprocessing.addIssuer(preprocessedDisclosureDocument, controllerDoc.id)
    zkpld.preprocessing.updateContext(preprocessedDisclosureDocument)

    /**
     * TODO: verify that zkpld DOES NOT apply/support JSON-LD Frames? Hence, this has to be done as a prior step?
     * For example, zkpld throws an error when using the @explicit keyword in the disclosure document.
     */
    preprocessedDisclosureDocument = await jsonld.frame(vc, preprocessedDisclosureDocument)
    zkpld.preprocessing.addProofObject(preprocessedDisclosureDocument)

    logv2(vc, 'vc')
    logv2(disclosureDocument, 'disclosureDocument')
    logv2(preprocessedDisclosureDocument, 'preprocessedDisclosureDocument')
    // writeJsonFile('temp.derive-input-vc.json', vc)
    // writeJsonFile('temp.derive-input-disclosureDocument.json', disclosureDocument)

    performance.mark(MARKERS.START_DERIVE, perfOptions)
    const vp = await implBbsTermwiseSignature2023.derive(vc, preprocessedDisclosureDocument)
    performance.mark(MARKERS.END_DERIVE, perfOptions)
    logv2(vp, 'vp (derived)')

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


export namespace bbsSignature2020 {

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

export namespace ed25519Signature2020 {

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
    const kp = await _Implementation_Ed25519Signature2020.createKeypairV2(controller)

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
    const preprocessedCredential = _Implementation_Ed25519Signature2020.preprocessVC(credential)

    console.log('>>> SIGN VC')
    performance.mark(MARKERS.START_SIGN_VC, perfOptions)
    const vc = await _Implementation_Ed25519Signature2020.sign(preprocessedCredential, kp, dl)
    performance.mark(MARKERS.END_SIGN_VC, perfOptions)

    console.log('>>> VERIFY VC')
    performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
    const verificationResult = await _Implementation_Ed25519Signature2020.verifySignedCredential(vc, dl)
    performance.mark(MARKERS.END_VERIFY_VC, perfOptions)
    assert(verificationResult.verified === true)

    // Clear registry
    r.clear()
  }
}

export namespace ecdsaSd2023Cryptosuite {
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
