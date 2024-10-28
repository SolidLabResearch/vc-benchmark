import {
    BbsBlsSignature2020,
    BbsBlsSignatureProof2020,
    deriveProof,
} from "@mattrglobal/jsonld-signatures-bbs";
import * as jsig from 'jsonld-signatures'

import {defaultDocumentLoader} from "../documentLoader";

export async function derive(vc: any, disclosed: any) {


    const derivedProof = await deriveProof(
        vc,
        disclosed,
        {
            suite: new BbsBlsSignatureProof2020(),
            documentLoader: defaultDocumentLoader

        }
    )
}


/*
export async function sign(credential: any, keypair: any, documentLoader: any) {
    const vc = await sign
}*/
