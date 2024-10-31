import {
    BbsBlsSignature2020,
    BbsBlsSignatureProof2020,
    Bls12381G2KeyPair,
    deriveProof,
} from "@mattrglobal/jsonld-signatures-bbs";
import * as jsig from 'jsonld-signatures'

import {defaultDocumentLoader} from "../documentLoader";
import {klona} from "klona";
import {GenerateKeyPairOptions} from "@zkp-ld/bls12381-key-pair";

export namespace Implementation_BbsBlsSignature2020 {

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
        if(!Array.isArray(vc['@context']))
            throw new Error('@context must be an array!')


        let out = klona(vc) // Apply preprocessing on a clone!

        // Add context: bbs/v1
        if(!vc['@context'].includes('https://w3id.org/security/bbs/v1'))
            out['@context'].push('https://w3id.org/security/bbs/v1');

        // Remove proof (if any)
        if(Object.keys(vc).includes('proof'))
            delete out['proof']


        return out
    }

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


    export async function createKeypair(gkp: GenerateKeyPairOptions): Promise<Bls12381G2KeyPair> {

        return await Bls12381G2KeyPair.generate(gkp)
    }

    export async function sign(credential: any, keypair: Bls12381G2KeyPair, documentLoader: any) {
        const suite = _hack_addEnsureContextFunction(
            new BbsBlsSignature2020({key: keypair})
        )
        return await jsig.sign(klona(credential), {
            suite,
            documentLoader,
            purpose: new jsig.purposes.AssertionProofPurpose(),
        })
    }

    export async function verify(vc: any, documentLoader: any) {
        return await jsig.verify(vc, {
            suite: new BbsBlsSignature2020(),
            purpose: new jsig.purposes.AssertionProofPurpose(),
            documentLoader,
        })
    }



}
