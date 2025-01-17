import {
  BbsBlsSignature2020,
  BbsBlsSignatureProof2020,
  Bls12381G2KeyPair,
  deriveProof,
} from "@mattrglobal/jsonld-signatures-bbs";
import jsigs from 'jsonld-signatures';
import {klona} from "klona";
import {GenerateKeyPairOptions} from "@zkp-ld/bls12381-key-pair";
import {AbstractImplementation} from "./AbstractImplementation";
// import {VerifiableCredential, VerifiablePresentation} from "@digitalcredentials/vc-data-model";
import {CONTEXTS} from "../contexts";
import {credential} from "../resources/ed25519-signature-2020/mock-data";
import {suite} from "node:test";
import {VerifiableCredential, VerifiablePresentation} from "@digitalcredentials/vc-data-model";
import {deriveProof} from "@zkp-ld/jsonld-proofs";


type VerifiableCredential = any
type VerifiablePresentation = any
export class Implementation_BbsBlsSignature2020 extends AbstractImplementation {
  verifyDerivedCredential(dvc: any): Promise<any> {
    throw new Error('Not implemented')
    return Promise.resolve(undefined);
  }

  verifySignedCredential(vc: any): Promise<any> {
    throw new Error('Not implemented')
    return Promise.resolve(undefined);
  }

  async sign(credential: any, key: any): Promise<any> {
    const suite = _Implementation_BbsBlsSignature2020._hack_addEnsureContextFunction(
      new BbsBlsSignature2020({key})
    )
    return await jsigs.sign(klona(credential), {
      suite,
      documentLoader: this.documentLoader,
      purpose: new jsigs.purposes.AssertionProofPurpose(),
    })

  }

  async verify(vc: any): Promise<any> {

    return await jsigs.verify(vc, {
      suite: new BbsBlsSignature2020(),
      purpose: new jsigs.purposes.AssertionProofPurpose(),
      documentLoader: this.documentLoader,
    })
  }

  async deriveVC(vc: any, disclosedDocument: any): Promise<VerifiableCredential> {
    return await deriveProof(
      vc,
      disclosedDocument,
      {
        suite: new BbsBlsSignatureProof2020(),
        documentLoader: this.documentLoader,
        // skipProofCompaction: false,
      }
    )
  }

  createPresentation(
    credentials: VerifiableCredential[],
    holder: undefined|string = undefined
  ): VerifiablePresentation {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
      ],
      type: ['VerifiablePresentation'],
      holder,
      verifiableCredential: credentials
    } as VerifiablePresentation
  }

  async signPresentation(p: VerifiablePresentation,
                         challenge: string,
                         purpose = new jsigs.purposes.AssertionProofPurpose()
  ): Promise<VerifiablePresentation> {
    return await jsigs.sign(
      klona(p), {
        suite: new BbsBlsSignatureProof2020(),
        documentLoader: this.documentLoader,
        purpose,
        challenge
      }
    )
  }


  /**
   * TODO: This function wraps deriveVC + signPresentation (to align with ZKP-LD's API)
   * @param vc
   * @param disclosedDocument
   * @param challenge
   */
  async derive(vc: VerifiableCredential, disclosedDocument: any, challenge: string): Promise<VerifiablePresentation> {
    const dvc = await this.deriveVC(vc, disclosedDocument)
    const p = this.createPresentation([vc])
    return p
    // const vp = await this.signPresentation(p, challenge) // TODO: delete (incl. sign Presentation) ??
    // return vp
  }

  async verifyVP(vp: any, challenge: string) {
    return await jsigs.verify(
      vp,
      {
        suite: new BbsBlsSignatureProof2020(),
        documentLoader: this.documentLoader,
        challenge,
        purpose: new jsigs.purposes.AssertionProofPurpose(),
      }
    );
  }

  async verifyDerived(dvc: any) {
    //Verify the derived proof
    return await jsigs.verify(dvc, {
      suite: new BbsBlsSignatureProof2020(),
      purpose: new jsigs.purposes.AssertionProofPurpose(),
      documentLoader: this.documentLoader
    });
  }

}

export namespace _Implementation_BbsBlsSignature2020 {

  export function _hack_addEnsureContextFunction(suite: any) {
    suite.ensureSuiteContext = ({document}: any) => {
      const contextUrls = [
        // 'https://w3id.org/security/suites/bls12381-2020/v1',
        'https://w3id.org/security/bbs/v1'
      ];

      if (typeof document['@context'] === 'string' && contextUrls.includes(document['@context'])) {
        return;
      }

      if (Array.isArray(document['@context']) &&
        contextUrls.filter(url => document['@context'].includes(url)).length) {
        return;
      }

      throw new TypeError(
        `The document to be signed must contain one of this suite's @context, ` +
        `"${contextUrls.join(', ')}", got "${document['@context']?.join(', ')}".`
      );
    };
    return suite;
  }

  export function preprocessVC(vc: any): any {
    if (!Array.isArray(vc['@context']))
      throw new Error('@context must be an array!')


    let out = klona(vc) // Apply preprocessing on a clone!

    // Add context: bbs/v1
    if (!vc['@context'].includes('https://w3id.org/security/bbs/v1'))
      out['@context'].push('https://w3id.org/security/bbs/v1');

    // Exclude particular contexts
    const toExclude = [
      'https://www.w3.org/ns/data-integrity/v1'
    ]
    out['@context'] = out['@context'].filter((c: any)=>!toExclude.includes(c))

    // Remove proof (if any)
    if (Object.keys(vc).includes('proof'))
      delete out['proof']


    return out
  }



  export async function createKeypair(gkp: GenerateKeyPairOptions): Promise<Bls12381G2KeyPair> {

    return await Bls12381G2KeyPair.generate(gkp)
  }





}
