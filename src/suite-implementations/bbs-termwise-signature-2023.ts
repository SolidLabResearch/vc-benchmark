import {sign, verify} from "@zkp-ld/jsonld-proofs";
import {AbstractImplementation} from "./AbstractImplementation";

export class Implementation_BbsTermwiseSignature2023 extends AbstractImplementation {

  async sign(credential: any, key: any): Promise<any> {
    return await sign(credential, key, this.documentLoader)
  }

  async verify(vc: any): Promise<any> {
    const { proof: { verificationMethod } } = vc;
    const {document} = await this.documentLoader(verificationMethod);
    const publicKeypairs = [ document ]
    return await verify(vc, publicKeypairs, this.documentLoader)
  }

}
