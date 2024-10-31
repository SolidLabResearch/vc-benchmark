import keypair from '../resources/zkp-ld/keypair.json';
import credential from '../resources/zkp-ld/vc0.json'
import {logv2} from "./utils/log";
import {sign, verify} from "@zkp-ld/jsonld-proofs";
import {createDocumentLoader, defaultContexts, defaultDocumentLoader} from "./documentLoader";
import assert from "node:assert";
import {Implementation_BbsBlsSignature2020} from "./suite-implementations/bbs-bls-signature-2020";
import {IDidDocument, IRegistry, IVerificationMethod} from "./interfaces";
import {performance} from "node:perf_hooks";
import * as fs from "node:fs";

export const MARKERS = {
    START_SIGN_VC: 'START_SIGN_VC',
    END_SIGN_VC: 'END_SIGN_VC',
    START_VERIFY_VC: 'START_VERIFY_VC',
    END_VERIFY_VC: 'END_VERIFY_VC',
}
namespace zkpld {
    const cryptosuite : string = 'bbs-termwise-signature-2023'
    export function redactControllerDoc(doc: any) {
        let redactedDoc = JSON.parse(JSON.stringify(doc));
        delete redactedDoc.verificationMethod.secretKeyMultibase
        return redactedDoc
    }

    export async function main() {
        logv2(keypair, 'keypair')
        logv2(credential, 'credential')
        const documentLoader = defaultDocumentLoader;

        const perfOptions = {
            detail: {
                implementation: 'zkpld'
            }
        }
        // Sign VC
        performance.mark(MARKERS.START_SIGN_VC, perfOptions)
        const vc = await sign(credential, keypair, documentLoader)
        performance.mark(MARKERS.END_SIGN_VC, perfOptions)
        logv2(vc, 'vc')
        assert(vc.proof.cryptosuite === cryptosuite)

        // Verify VC
        const publicKeypair = zkpld.redactControllerDoc(keypair)
        performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
        const verificationResult = await verify(vc, [publicKeypair], documentLoader)
        performance.mark(MARKERS.END_VERIFY_VC, perfOptions)
        logv2(verificationResult, 'verificationResult')
        assert(verificationResult.verified === true)
    }
}

namespace bbsSignature2020 {
    export class MyRegistry implements IRegistry {
        private db;
        constructor() {
            this.db = new Map();
        }
        register(id: string, doc: object): void {
            console.log(`Registering: ${id}`)
            this.db.set(id, doc);
        }

        resolve(id: string): object {
            console.log(`Resolving: ${id}`)
            if(!this.db.has(id))
                throw new Error(`${id} not registered!`)
            const doc = this.db.get(id);
            logv2(doc, 'doc')
            return doc
        }

        getIds(): string[] {
            return Array.from(this.db.keys())
        }
    }
    export async function main() {
        const r = new MyRegistry()
        const perfOptions = {
            detail: {
                implementation: 'BbsBlsSignature2020'
            }
        }
        // Create issuer keypair
        const controller: string = 'did:example:test-bbs-signature-2020'
        const kp = await Implementation_BbsBlsSignature2020.createKeypair({
            seed: Uint8Array.from(
                Buffer.from('s3cr3t','base64')
            ),
            controller,
            id: 'did:example:test-bbs-signature-2020#g2'
        })


        const vm: IVerificationMethod = {
            type: 'BbsBlsSignature2020',
            id: kp.id!,
            controller: kp.controller!,
            publicKeyBase58: kp.publicKey,
        }

        const controllerDocument = {
            '@context': ['https://www.w3.org/ns/did/v1'],
            id: kp.controller!,
            verificationMethod: [ vm ],
            assertionMethod: [ vm.id ]
        }

        // Register controller document and public keypair material
        r.register(controller, controllerDocument)
        r.register(vm.id, vm)

        // Create documentloader that supports registry lookups
        const dl = createDocumentLoader(defaultContexts, r)

        // Preprocess VC
        const preprocessedCredential = Implementation_BbsBlsSignature2020.preprocessVC(credential)
        // Sign VC
        performance.mark(MARKERS.START_SIGN_VC, perfOptions)
        const vc = await Implementation_BbsBlsSignature2020.sign(preprocessedCredential, kp, dl)
        performance.mark(MARKERS.END_SIGN_VC, perfOptions)

        performance.mark(MARKERS.START_VERIFY_VC, perfOptions)
        const verificationResult = await Implementation_BbsBlsSignature2020.verify(vc, dl)
        performance.mark(MARKERS.END_VERIFY_VC, perfOptions)
        logv2(verificationResult, 'verificationResult')
        assert(verificationResult.verified === true)
    }
    export async function verify(vc: any) {

    }

}

async function printPerformanceRecords() {
    logv2(performance.getEntries(), 'performanceRecords')
    fs.writeFileSync('performanceRecords.json', JSON.stringify(performance.getEntries()))

}
zkpld.main().then(printPerformanceRecords).catch(console.error)
bbsSignature2020.main().then(printPerformanceRecords).catch(console.error)

