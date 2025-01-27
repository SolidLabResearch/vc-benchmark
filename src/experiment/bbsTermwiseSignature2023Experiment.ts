import {ICredentialSetup} from "../interfaces";
import {Implementation_BbsTermwiseSignature2023} from "../suite-implementations/bbs-termwise-signature-2023";
import keypair from "../resources/zkp-ld/keypair.json";
import {registerControllerDocumentAtRegistry} from "../helpers";
import {createDocumentLoader, defaultContexts} from "../documentLoader";
import {readJsonFile} from "../utils/io";
import {performance} from "node:perf_hooks";
import assert from "node:assert";
import {klona} from "klona";
import jsonld from "jsonld";
import {MARKERS, zkpld} from "../experiment";
import {AbstractExperiment} from "./AbstractExperiment";

export class BbsTermwiseSignature2023Experiment extends AbstractExperiment {

  constructor(credentialSetup: ICredentialSetup) {
    const cryptosuite = 'bbs-termwise-signature-2023';
    const ctrImp = Implementation_BbsTermwiseSignature2023
    super(credentialSetup, cryptosuite, ctrImp);
  }

  async _run(): Promise<any> {
    const controllerDoc = zkpld.redactControllerDoc(keypair)
    registerControllerDocumentAtRegistry(controllerDoc, this.r)
    const dl = createDocumentLoader(defaultContexts, this.r)

    const credential = readJsonFile(this.credentialSetup.credential.toString())


    const imp = new this.ctrImp(dl)

    // Sign VC
    this.log('>>> SIGN VC')
    let preprocessedCredential = zkpld.preprocessing.addProofObject(credential)
    zkpld.preprocessing.updateContext(preprocessedCredential)
    this.exportObject(preprocessedCredential, 'preprocessedCredential.json')

    performance.mark(MARKERS.START_SIGN_VC, this.perfOptions)
    const vc = await imp.sign(preprocessedCredential, keypair)
    performance.mark(MARKERS.END_SIGN_VC, this.perfOptions)
    assert(vc.proof.cryptosuite === this.cryptosuite)
    this.exportObject(vc, 'vc')

    // Verify VC
    console.log('>>> VERIFY VC')
    performance.mark(MARKERS.START_VERIFY_VC, this.perfOptions)
    const verificationResult = await imp.verify(vc)
    performance.mark(MARKERS.END_VERIFY_VC, this.perfOptions)
    assert(verificationResult.verified === true)

    // Derive VC
    console.log('>>> DERIVE VC')
    // Preprocessing
    zkpld.preprocessing.addIssuer(vc, controllerDoc.id)
    let preprocessedDisclosureDocument = klona(this.disclosureDocument) as any
    zkpld.preprocessing.addIssuer(preprocessedDisclosureDocument, controllerDoc.id)
    zkpld.preprocessing.updateContext(preprocessedDisclosureDocument)

    /**
     * TODO: verify that zkpld DOES NOT apply/support JSON-LD Frames? Hence, this has to be done as a prior step?
     * For example, zkpld throws an error when using the @explicit keyword in the disclosure document.
     */
    preprocessedDisclosureDocument = await jsonld.frame(vc, preprocessedDisclosureDocument, {documentLoader: dl});
    zkpld.preprocessing.addProofObject(preprocessedDisclosureDocument)

    this.exportObject(preprocessedDisclosureDocument, 'preprocessedDisclosureDocument')
    console.log('\tpreprocessed DisclosureDocument')

    performance.mark(MARKERS.START_DERIVE, this.perfOptions)
    const vp = await imp.derive(vc, preprocessedDisclosureDocument)
    performance.mark(MARKERS.END_DERIVE, this.perfOptions)
    this.exportObject(vp, 'dvp')

    // Verify VP with derived VC
    console.log('>>> VERIFY VP (DERIVED VC)')
    performance.mark(MARKERS.START_VERIFY_DERIVED, this.perfOptions)
    const vrDerived = await imp.verifyDerived!(vp)
    performance.mark(MARKERS.END_VERIFY_DERIVED, this.perfOptions)
    assert(vrDerived.verified === true)
    this.exportObject(vrDerived, 'vrDerived')

    // Clear registry
    this.r.clear()
  }
}
