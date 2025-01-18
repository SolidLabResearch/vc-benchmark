// @ts-ignore
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
// @ts-ignore
import {Ed25519VerificationKey2020} from '@digitalbazaar/ed25519-verification-key-2020';
// @ts-ignore
import {Ed25519Signature2020, suiteContext} from '@digitalbazaar/ed25519-signature-2020';
// @ts-ignore
import jsigs from 'jsonld-signatures-v9-0-0';
import {klona} from "klona";
import {AbstractImplementation} from "./AbstractImplementation";

export class Implementation_Ed25519Signature2020 extends AbstractImplementation {

  async derive(vc: any, disclosureDocument: any): Promise<any> {
    throw new Error(`Ed25519Signature2020 does NOT support selective disclosure functionality`)
  }

  deriveVC(vc: any, disclosureDocument: any, challenge?: string): Promise<any> {
    throw new Error(`Ed25519Signature2020 does NOT support selective disclosure functionality`)
  }

  async sign(credential: any, key: any): Promise<any> {
    return await _Implementation_Ed25519Signature2020.sign(credential, key, this.documentLoader)
  }

  async verify(vc: any): Promise<any> {
    return await _Implementation_Ed25519Signature2020.verifySignedCredential(vc,  this.documentLoader)
  }

  verifyDerived(d: any, challenge?: string): Promise<any> {
    throw new Error(`Ed25519Signature2020 does NOT support selective disclosure functionality`)
  }

  verifyDerivedCredential(dvc: any): Promise<any> {
    throw new Error(`Ed25519Signature2020 does NOT support selective disclosure functionality`)
  }

  verifySignedCredential(vc: any): Promise<any> {
    return Promise.resolve(undefined);
  }

}

export namespace _Implementation_Ed25519Signature2020 {

  export const contextsToInclude = [
    'https://www.w3.org/2018/credentials/v1',
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
  ]

  /**
   * TODO: safe delete
   * @param controller
   * @param seed
   */
  export async function createKeypair(controller: string, seed: string) {
    let seedBytes = (new TextEncoder()).encode(seed)
    if (seedBytes.length < 32)
      throw new Error(`Given seed string should be >= 32 bytes (currently: ${seedBytes.length} bytes)`)
    seedBytes = seedBytes.slice(0, 32);
    const kp = await Ed25519Multikey.generate({controller, seed: seedBytes})
    return kp
  }

  /**
   * NOTE: The created keypair is fixed (i.e., not based on a seed).
   * @param controller
   */
  export async function createKeypairV2(controller: string) {
    return await Ed25519VerificationKey2020.from({
      type: 'Ed25519VerificationKey2020',
      controller,
      id: controller + '#z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
      publicKeyMultibase: 'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
      privateKeyMultibase: 'zrv2EET2WWZ8T1Jbg4fEH5cQxhbUS22XxdweypUbjWVzv1YD6VqYu' +
        'W6LH7heQCNYQCuoKaDwvv2qCWz3uBzG2xesqmf'
    });

  }

  export function preprocessVC(vc: any) {
    let out = klona(vc)

    // Exclude particular contexts
    const toExclude = [
      'https://www.w3.org/ns/data-integrity/v1',
      "https://w3id.org/security/bbs/v1",

    ]
    out['@context'] = out['@context'].filter((c: any)=>!toExclude.includes(c))

    // Remove proof, if existent
    if (Object.keys(out).includes('proof'))
      delete out['proof'];
    return out
  }


  /**
   * Existing code to check
   * - [ ] https://github.com/digitalbazaar/ed25519-signature-2020
   * - [ ] https://gitlab.ilabt.imec.be/KNoWS/projects/onto-deside/solid-dif/solid-dif-poc/-/blob/5806bac4a8ffe67bb2b5a134481f520efcee6da4/sign-something.js
   * @param credential
   * @param key
   * @param documentLoader
   */
  export async function sign(credential: any,
                             key: any,
                             documentLoader: any,) {

    const suite = new Ed25519Signature2020({key})

    const vc = await jsigs.sign(
      klona(credential), {
        suite,
        purpose: new jsigs.purposes.AssertionProofPurpose(),
        documentLoader,
        expansionMap: false // Set to False to fix Error: "expansionMap" not supported. At Ed25519Signature2020.createProof
      }
    )

    return vc
  }

  export async function verifySignedCredential(vc: any, documentLoader: any) {
    return await jsigs.verify(vc, {
      suite: new Ed25519Signature2020(),
      purpose: new jsigs.purposes.AssertionProofPurpose(),
      documentLoader,
      expansionMap: false
    })
  }

}
