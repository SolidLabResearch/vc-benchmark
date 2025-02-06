import {AbstractImplementation} from "./AbstractImplementation";
import {DataIntegrityProof} from "@digitalbazaar/data-integrity";
import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
// @ts-ignore
import jsigs from 'jsonld-signatures-v11-2-1';
import {klona} from "klona";
import * as ecdsaSd2023Cryptosuite from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';

export class Implementation_EcdsaSd2023Cryptosuite
extends AbstractImplementation
{
  deriveVC(vc: any, disclosureDocument: any, challenge?: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  verifyDerived(d: any, challenge?: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  verifyDerivedCredential?(dvc: any): Promise<any> {
      throw new Error("Method not implemented.");
  }

  static async createKeypair(controller: string) {
    return await generateKeypair(controller)
  }

  async sign(credential: any, key: any): Promise<any> {

    const suite = new DataIntegrityProof({
      signer: key.signer(),
      cryptosuite: ecdsaSd2023Cryptosuite.createSignCryptosuite({
        // NOTE: here, you can set optional and mandatory fields
      })
    })

    const signedCredential = await jsigs.sign(
      credential,
      {
        suite,
        purpose: new jsigs.purposes.AssertionProofPurpose(),
        documentLoader: this.documentLoader
      }
    )

    return signedCredential;
  }

  async derive(credential: any, selectivePointers: string[]) {
    const cryptosuite = ecdsaSd2023Cryptosuite.createDiscloseCryptosuite({ selectivePointers })
    const suite = new DataIntegrityProof({ cryptosuite })
    const derivedCredential = await jsigs.derive(klona(credential), {
      suite,
      purpose: new jsigs.purposes.AssertionProofPurpose(),
      documentLoader: this.documentLoader
    })
    return derivedCredential;
  }
  
  async verifySignedCredential(vc: any): Promise<any> {
    const cryptosuite = ecdsaSd2023Cryptosuite.createConfirmCryptosuite()
    const suite = new DataIntegrityProof({ cryptosuite })
    const verificationResult = await jsigs.verify(
      vc,
      {
        suite,
        purpose: new jsigs.purposes.AssertionProofPurpose(),
        documentLoader: this.documentLoader
      }
    )
    return verificationResult;
  }

  async verify(vc: any): Promise<any> {
    const cryptosuite = ecdsaSd2023Cryptosuite.createVerifyCryptosuite()
    const suite = new DataIntegrityProof({ cryptosuite })
    const verificationResult = await jsigs.verify(
      vc,
      {
        suite,
        purpose: new jsigs.purposes.AssertionProofPurpose(),
        documentLoader: this.documentLoader
      }
    )
    return verificationResult;
  }

}

/**
 * This function generates a keypair and uses a controller parameter for its creation.
 * The generation function is documented by:
 * https://github.com/digitalbazaar/ecdsa-multikey?tab=readme-ov-file#generating-a-new-publicsecret-key-pair
 * To generate a new public/secret key pair:
 *
 * {string} [curve] [Required] ECDSA curve used to generate the key: ['P-256', 'P-384', 'P-521'].
 * {string} [id] [Optional] ID for the generated key.
 * {string} [controller] [Optional] Controller URI or DID to initialize the generated key. (This will be used to generate id if it is not explicitly defined.)
 */
export async function generateKeypair(controller: string) {
  const id = `${controller}#keypair`
  const kp = await EcdsaMultikey.generate({curve: 'P-256', controller, id});
  return kp
}
