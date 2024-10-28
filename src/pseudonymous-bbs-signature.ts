/**
 * Objective: selectively disclose data using a pseudonymous signature
 * https://www.w3.org/TR/2024/CRD-vc-di-bbs-20241015/#createdisclosuredata
 */
import keypair from '../resources/zkp-ld/keypair.json';
import credential from '../resources/zkp-ld/vc0.json';
import disclosed from '../resources/zkp-ld/disclosed0.json';

import {logv2} from "./utils/log";
import {localDocumentLoader} from "./documentLoader";
import {deriveProof, DeriveProofOptions, sign, VC, VCPair} from "@zkp-ld/jsonld-proofs";
const documentLoader = localDocumentLoader;
function getPublicKeys() {
    return [ keypair ]
}
namespace Issuer {
    export async function issueVC(): Promise<VC> {
        return await sign(credential, keypair, documentLoader)
    }
}

namespace Holder {
    export async function derive(vc: VC, disclosed: VC){
        const vcPairs: VCPair[] = [
            { original: vc, disclosed}
        ]
        const publicKeys = getPublicKeys()
        const deriveProofOptions: DeriveProofOptions = {
            withPpid: true,
            secret: new Uint8Array(Buffer.from('s3cr3t')),
            domain: 'holder.domain'
        }
        const derivedProof = await deriveProof(
            vcPairs,
            publicKeys,
            documentLoader,
            deriveProofOptions
        )
        logv2(derivedProof, 'derivedProof')
    }
}
async function main() {
    const vc = await Issuer.issueVC();
    await Holder.derive(vc, disclosed)
}

main().then().catch(console.error)
