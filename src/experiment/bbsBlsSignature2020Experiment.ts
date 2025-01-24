import {DisclosureFormat, ICredentialSetup, IVerificationMethod} from "../interfaces";
import {
  _Implementation_BbsBlsSignature2020,
  Implementation_BbsBlsSignature2020
} from "../suite-implementations/bbs-bls-signature-2020";
import {createDocumentLoader, defaultContexts} from "../documentLoader";
import {readJsonFile, writeJsonFile} from "../utils/io";
import {performance} from "node:perf_hooks";
import assert from "node:assert";
import {bbsSignature2020, MARKERS} from "../experiment";
import {AbstractExperiment} from "./AbstractExperiment";
import {getNestedAttribute, matchVariableAssignments, setNestedAttribute} from "../utils/json";
import {logv2} from "../utils/log";

export class BbsBlsSignature2020Experiment extends AbstractExperiment {

  constructor(credentialSetup: ICredentialSetup) {
    const cryptosuite = 'bbs-bls-signature-2020';
    const ctrImp = Implementation_BbsBlsSignature2020
    super(credentialSetup, cryptosuite, ctrImp);
  }

  async _run(): Promise<any> {
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
    this.r.register(controller, controllerDocument)
    this.r.register(vm.id, vm)

    // Create documentloader that supports registry lookups
    const preprocessedContexts = Object.fromEntries(
      Object.entries(defaultContexts)
        .filter((pair) => !bbsSignature2020.contextsToExclude.includes(pair[0]))
    )
    const dl = createDocumentLoader(preprocessedContexts, this.r)

    // Instantiate implementation
    const imp = new this.ctrImp(dl)

    // Preprocess VC
    const credential = readJsonFile(this.credentialSetup.credential.toString())
    this.log(credential, 'credential')
    let preprocessedCredential = _Implementation_BbsBlsSignature2020.preprocessVC(credential)
    preprocessedCredential['issuer'] = controller
    this.exportObject(preprocessedCredential, 'preprocessedCredential')

    // Sign VC
    performance.mark(MARKERS.START_SIGN_VC, this.perfOptions)
    const vc = await imp.sign(preprocessedCredential, kp)
    performance.mark(MARKERS.END_SIGN_VC, this.perfOptions)
    this.exportObject(vc, 'vc')

    // Verify VC
    performance.mark(MARKERS.START_VERIFY_VC, this.perfOptions)
    const verificationResult = await imp.verify(vc)
    performance.mark(MARKERS.END_VERIFY_VC, this.perfOptions)
    assert(verificationResult.verified === true)

    // Derive VC
    this.log('>>> DERIVE VC')
    // Preprocess disclosed document
    let preprocessedDisclosed = readJsonFile(this.credentialSetup.disclosureDocument.toString())
    // @ts-ignore
    preprocessedDisclosed['@context'] = preprocessedDisclosed['@context'].filter((c) => (typeof c === "string") && !bbsSignature2020.contextsToExclude.includes(c))
    // Add context: bbs/v1
    if (!preprocessedDisclosed['@context'].includes('https://w3id.org/security/bbs/v1'))
      preprocessedDisclosed['@context'].push('https://w3id.org/security/bbs/v1');
    // This crypto suite does NOT require a minimal proof object
    delete preprocessedDisclosed['proof']

    this.exportObject(preprocessedDisclosed, 'preprocessedDisclosureDocument')



    performance.mark(MARKERS.START_DERIVE, this.perfOptions)
    let dvc = await imp.deriveVC!(vc, preprocessedDisclosed,)
    performance.mark(MARKERS.END_DERIVE, this.perfOptions)
    this.exportObject(dvc, 'dvc')

    this.log('>>> VERIFY DERIVED VC')
    performance.mark(MARKERS.START_VERIFY_DERIVED, this.perfOptions)
    // const vrDerived = await (imp as Implementation_BbsBlsSignature2020).verifyDerived(dvc)
    const vrDerived = await imp.verifyDerivedCredential!(dvc)
    performance.mark(MARKERS.END_VERIFY_DERIVED, this.perfOptions)
    this.exportObject(vrDerived, 'vrDerived')

    assert(vrDerived.verified === true)

    // Clear registry
    this.r.clear()

  }

}
