import keypair from '../resources/zkp-ld/keypair.json';
import credential from '../resources/zkp-ld/vc0.json'
import {logv2} from "./utils/log";
import {sign, verify} from "@zkp-ld/jsonld-proofs";
import {createDocumentLoader, defaultContexts, defaultDocumentLoader} from "./documentLoader";
import assert from "node:assert";
import {Implementation_BbsBlsSignature2020} from "./suite-implementations/bbs-bls-signature-2020";
import {IDidDocument, IRegistry, IVerificationMethod} from "./interfaces";

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

        // Sign VC
        const vc = await sign(credential, keypair, documentLoader)
        logv2(vc, 'vc')
        assert(vc.proof.cryptosuite === cryptosuite)

        // Verify VC
        const publicKeypair = zkpld.redactControllerDoc(keypair)
        const verificationResult = await verify(vc, [publicKeypair], documentLoader)
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
        const vc = await Implementation_BbsBlsSignature2020.sign(preprocessedCredential, kp, dl)
        const verificationResult = await Implementation_BbsBlsSignature2020.verify(vc, dl)
        logv2(verificationResult, 'verificationResult')
        assert(verificationResult.verified === true)
    }
    export async function verify(vc: any) {

    }

}

zkpld.main().then().catch(console.error)
bbsSignature2020.main().then().catch(console.error)

