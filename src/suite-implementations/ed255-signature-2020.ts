// @ts-ignore
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
// @ts-ignore
import {Ed25519Signature2020, suiteContext} from '@digitalbazaar/ed25519-signature-2020';
import jsigs from 'jsonld-signatures';
import {klona} from "klona";
import {logv2} from "../utils/log";

export namespace Implementation_Ed25519Signature2020 {
  export function preprocessVC(vc: any) {
    let out = klona(vc)
    if (Object.keys(out).includes('proof'))
      delete out['proof'];
    return out
  }

  export async function createKeypair(controller: string, seed: string) {
    let seedBytes = (new TextEncoder()).encode(seed)
    if (seedBytes.length < 32)
      throw new Error(`Given seed string should be >= 32 bytes (currently: ${seedBytes.length} bytes)`)
    seedBytes = seedBytes.slice(0, 32);
    const kp = await Ed25519Multikey.generate({controller, seed: seedBytes})
    return kp
  }

  export async function sign(credential: any,
                             key: any,
                             documentLoader: any,) {

    const suite = new Ed25519Signature2020({key})

    const vc = await jsigs.sign(
      klona(credential), {
        suite,
        purpose: new jsigs.purposes.AssertionProofPurpose(),
        documentLoader
      }
    )

    return vc
  }

  export async function verify(vc: any, documentLoader: any) {
    return await jsigs.verify(vc, {
      suite: new Ed25519Signature2020(),
      purpose: new jsigs.purposes.AssertionProofPurpose(),
      documentLoader
    })
  }

}
