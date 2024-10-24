import keypair from '../resources/zkp-ld/keypair.json';
import credential from '../resources/zkp-ld/vc0.json'
import {logv2} from "./utils/log";
import {sign} from "@zkp-ld/jsonld-proofs";
import {localDocumentLoader} from "./documentLoader";
import assert from "node:assert";

namespace zkpld {
    const cryptosuite : string = 'bbs-termwise-signature-2023'

    export async function main() {
        logv2(keypair, 'keypair')
        logv2(credential, 'credential')
        const documentLoader = localDocumentLoader;
        const vc = await sign(credential, keypair, documentLoader)
        logv2(vc, 'vc')
        assert(vc.proof.cryptosuite === cryptosuite)
    }
}


zkpld.main().then().catch(console.error)

