import {ICredentialSetup} from "../interfaces";
import {
  _Implementation_Ed25519Signature2020,
  Implementation_Ed25519Signature2020
} from "../suite-implementations/ed255-signature-2020";
import {AbstractExperiment, MARKERS} from "../experiment";
import {createDocumentLoader, defaultContexts} from "../documentLoader";
import {readJsonFile} from "../utils/io";
import {performance} from "node:perf_hooks";
import assert from "node:assert";

export class Ed25519Signature2020Experiment extends AbstractExperiment {
  constructor(credentialSetup: ICredentialSetup) {
    super(credentialSetup, 'ed25519-signature-2020', Implementation_Ed25519Signature2020);
  }

  async run(): Promise<any> {
    const controller = 'did:example:test-ed25519-signature-2020'

    // Create keypair
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
    this.r.register(controller, controllerDocument)
    this.r.register(vm.id, vm)

    // Create documentloader that supports registry lookups
    const dl = createDocumentLoader(defaultContexts, this.r)

    // Instantiate implementation
    const imp = new this.ctrImp(dl)

    // VC: preprocess
    const credential = readJsonFile(this.credentialSetup.credential.toString())
    const preprocessedCredential = _Implementation_Ed25519Signature2020.preprocessVC(credential)

    // Sign VC
    performance.mark(MARKERS.START_SIGN_VC, this.perfOptions)
    const vc = await imp.sign(preprocessedCredential, kp)
    performance.mark(MARKERS.END_SIGN_VC, this.perfOptions)


    console.log('>>> VERIFY VC')
    performance.mark(MARKERS.START_VERIFY_VC, this.perfOptions)
    const verificationResult = await imp.verify(vc)
    performance.mark(MARKERS.END_VERIFY_VC, this.perfOptions)
    assert(verificationResult.verified === true)

    this.r.clear()
  }
}
