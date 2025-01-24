import {MARKERS} from "../experiment";
import {ICredentialSetup, IVerificationMethod} from "../interfaces";
import {Implementation_EcdsaSd2023Cryptosuite} from "../suite-implementations/ecdsa-sd-2023-cryptosuite";
import {createDocumentLoader, defaultContexts} from "../documentLoader";
import dataIntegrity from "@digitalbazaar/data-integrity-context";
import {performance} from "node:perf_hooks";
import assert from "node:assert";
import {readJsonFile} from "../utils/io";
import {frameToJsonPointers} from "../utils/json";
import {AbstractExperiment} from "./AbstractExperiment";


export class EcdsaSd2023CryptosuiteExperiment extends AbstractExperiment {

  constructor(credentialSetup: ICredentialSetup) {
    super(credentialSetup, 'ecdsa-sd-2023-cryptosuite', Implementation_EcdsaSd2023Cryptosuite);
  }

  async _run(): Promise<any> {
    const controller = 'did:example:test-ecdsa-sd-2023';
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
    this.r.register(vm.id, vm)

    // Register signatory's corresponding controller document
    const controllerDocEcdsaMultikey = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/multikey/v1'
      ],
      id: kpExport.controller,
      assertionMethod: [vm.id]
    };
    this.r.register(controllerDocEcdsaMultikey.id, controllerDocEcdsaMultikey)

    // Documentloader
    const contexts = {
      ...defaultContexts,
      [dataIntegrity.DATA_INTEGRITY_CONTEXT_V2_URL]: dataIntegrity.CONTEXT
    }
    const dl = createDocumentLoader(contexts, this.r)

    // Instantiate implementation
    const impl = new this.ctrImp(dl)

    // Credential (unsigned)
    let credential = readJsonFile(this.credentialSetup.credential.toString())
    credential['issuer'] = controllerDocEcdsaMultikey.id;

    // Sign credential
    this.log('>>> SIGN VC')
    performance.mark(MARKERS.START_SIGN_VC, this.perfOptions)
    const signedCredential = await impl.sign(credential, kp)
    performance.mark(MARKERS.END_SIGN_VC, this.perfOptions)
    this.exportObject(signedCredential, 'vc')

    // Verify signed credential
    this.log('>>> VERIFY VC')
    performance.mark(MARKERS.START_VERIFY_VC, this.perfOptions)
    const verificationResult = await impl.verifySignedCredential!(signedCredential)
    assert(verificationResult.verified === true)
    performance.mark(MARKERS.END_VERIFY_VC, this.perfOptions)

    // Derive credential
    this.log('>>> DERIVE VC')
    // const selectivePointers = ['/credentialSubject/id']
    const disclosureDocument = readJsonFile(this.credentialSetup.disclosureDocument.toString())
    // Transform JSON-LD Frame disclosure document to JSON Pointers and confine to pointers within the credentialSubject
    const selectivePointers = frameToJsonPointers(disclosureDocument)
      .filter(sp => sp.includes('/credentialSubject/'))
      .filter(sp => !sp.includes('@type'))
      .filter(sp => !sp.includes('@value'))
    this.exportObject(selectivePointers, 'preprocessedDisclosureDocument')

    performance.mark(MARKERS.START_DERIVE, this.perfOptions)
    const derivedCredential = await impl.derive(signedCredential, selectivePointers)
    performance.mark(MARKERS.END_DERIVE, this.perfOptions)
    this.exportObject(derivedCredential, 'dvc')

    // Verify (derived) credential
    performance.mark(MARKERS.START_VERIFY_DERIVED, this.perfOptions)
    const derivedVerificationResult = await impl.verify(derivedCredential)
    performance.mark(MARKERS.END_VERIFY_DERIVED, this.perfOptions)
    assert(derivedVerificationResult.verified === true)

    // Clear registry
    this.r.clear()
  }
}
