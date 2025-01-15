"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.derivationFrame = exports.unsigned = void 0;
exports.unsigned = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        "https://w3id.org/security/bbs/v1",
        "https://w3id.org/citizenship/v1"
    ],
    id: 'urn:vc:01',
    type: [
        'VerifiableCredential'
    ],
    issuer: undefined,
    issuanceDate: '2021-06-19T18:53:11Z',
    credentialSubject: {
        id: 'urn:test:id000',
        "type": [
            "PermanentResident",
            "Person"
        ],
        'identifier': '123456789ab',
        'givenName': 'Alice',
        'familyName': "Doe",
        'solid:webid': "http://localhost:3000/alice/profile/card#me"
    }
};
exports.derivationFrame = {
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/bbs/v1",
        "https://w3id.org/citizenship/v1",
    ],
    "type": ["VerifiableCredential"],
    "credentialSubject": {
        "@explicit": true,
        "type": ["PermanentResident", "Person"],
        // 'identifier': {},
        'solid:webid': {}
    }
};
