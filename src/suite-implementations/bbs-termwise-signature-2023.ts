import {deriveProof, sign, VCPair, verify, verifyProof} from "@zkp-ld/jsonld-proofs";
import {AbstractImplementation} from "./AbstractImplementation";
import {credential} from "../resources/ed25519-signature-2020/mock-data";
import * as vm from "node:vm";

export class Implementation_BbsTermwiseSignature2023 extends AbstractImplementation {
  deriveVC?(vc: any, disclosureDocument: any, challenge?: string): Promise<any> {
      throw new Error("Method not implemented.");
  }
  verifySignedCredential?(vc: any): Promise<any> {
      throw new Error("Method not implemented.");
  }
  verifyDerivedCredential?(dvc: any): Promise<any> {
      throw new Error("Method not implemented.");
  }

  async sign(credential: any, key: any): Promise<any> {
    return await sign(credential, key, this.documentLoader)
  }

  async verify(vc: any): Promise<any> {
    const { proof: { verificationMethod } } = vc;
    const {document} = await this.documentLoader(verificationMethod);
    const publicKeypairs = [ document ]
    return await verify(vc, publicKeypairs, this.documentLoader)
  }

  async derive(vc: any, disclosedDocument: any): Promise<any> {
    const vcPairs = [{original: vc, disclosed: disclosedDocument}]
    const publicKeys = await this.resolveControllerDocumentsForVcPairs(vcPairs)
    const deriveProofOptions = undefined
    return await deriveProof(vcPairs, publicKeys, this.documentLoader, deriveProofOptions)
  }

  async verifyDerived(d: any): Promise<any> {
    return await this.verifyVP(d)
  }


  async verifyVP(vp: any) {
    const publicKeys = await this.resolvePublicKeysForVP(vp)
    const verifyProofOptions = undefined
    return await verifyProof(vp, publicKeys, this.documentLoader, verifyProofOptions)
  }

  async resolvePublicKeysForVP(vp: any) {

    let {verifiableCredential} = vp;

    if (!Array.isArray(verifiableCredential))
      verifiableCredential = [verifiableCredential]

    const identifiersToResolve = verifiableCredential
      .map((vci: any) => vci.proof.verificationMethod)
      .map((vm: any) => vm.split('#')[0])

    const controllerDocs = await Promise.all(
      identifiersToResolve.map(async (id:any) => {
        const { document } = await this.documentLoader(id)
        return document
      })
    )
    // TODO: check whether nr. resolved controller docs === nr. identifiersToResolve; if not --> Error!
    return controllerDocs
  }

  async resolveControllerDocumentsForVcPairs(vcPairs: any[]): Promise<any> {
    if (!Array.isArray(vcPairs))
      throw new Error('VC Pairs should be an array!')
    if (Object.entries(vcPairs).length <= 0)
      throw new Error('There are no VC Pairs')

    return await Promise.all(
      vcPairs.flatMap(({original}) => {
        let issuer = undefined
        if ('https://www.w3.org/2018/credentials#issuer' in original)
          issuer = original['https://www.w3.org/2018/credentials#issuer']['@id']
        else
          issuer = original['issuer']

        return issuer
      })
        .map(async (issuer) => {
          if (issuer === undefined)
            throw new Error('Issuer is undefined!')
          const { document } = await this.documentLoader(issuer)
          return document
        })
    )
  }

}
