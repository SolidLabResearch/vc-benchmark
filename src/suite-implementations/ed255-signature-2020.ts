// @ts-ignore
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
// @ts-ignore
import {Ed25519VerificationKey2020} from '@digitalbazaar/ed25519-verification-key-2020';
// @ts-ignore
import {Ed25519Signature2020, suiteContext} from '@digitalbazaar/ed25519-signature-2020';
// @ts-ignore
import jsigs from 'jsonld-signatures-v9-0-0';
import {klona} from "klona";
import {logv2} from "../utils/log";

export namespace Implementation_Ed25519Signature2020 {


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
