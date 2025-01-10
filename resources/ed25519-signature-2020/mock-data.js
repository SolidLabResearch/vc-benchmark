"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credential = exports.controllerDoc2018 = exports.controllerDoc2020 = exports.mockKeyPair2018 = exports.mockKeyPair2020 = exports.mockPublicKey2018 = exports.mockPublicKey2020 = exports.controller = void 0;
/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
exports.controller = 'https://example.edu/issuers/565049';
exports.mockPublicKey2020 = {
    '@context': 'https://w3id.org/security/suites/ed25519-2020/v1',
    type: 'Ed25519VerificationKey2020',
    controller: exports.controller,
    id: exports.controller + '#z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
    publicKeyMultibase: 'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T'
};
exports.mockPublicKey2018 = {
    '@context': 'https://w3id.org/security/suites/ed25519-2018/v1',
    type: 'Ed25519VerificationKey2018',
    controller: exports.controller,
    id: exports.controller + '#z6MkumafR1duPR5FZgbVu8nzX3VyhULoXNpq9rpjhfaiMQmx',
    publicKeyBase58: 'DggG1kT5JEFwTC6RJTsT6VQPgCz1qszCkX5Lv4nun98x'
};
exports.mockKeyPair2020 = {
    type: 'Ed25519VerificationKey2020',
    controller: exports.controller,
    id: exports.controller + '#z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
    publicKeyMultibase: 'z6MknCCLeeHBUaHu4aHSVLDCYQW9gjVJ7a63FpMvtuVMy53T',
    privateKeyMultibase: 'zrv2EET2WWZ8T1Jbg4fEH5cQxhbUS22XxdweypUbjWVzv1YD6VqYu' +
        'W6LH7heQCNYQCuoKaDwvv2qCWz3uBzG2xesqmf'
};
exports.mockKeyPair2018 = {
    type: 'Ed25519VerificationKey2018',
    controller: exports.controller,
    id: exports.controller + '#z6MkumafR1duPR5FZgbVu8nzX3VyhULoXNpq9rpjhfaiMQmx',
    publicKeyBase58: 'DggG1kT5JEFwTC6RJTsT6VQPgCz1qszCkX5Lv4nun98x',
    privateKeyBase58: 'sSicNq6YBSzafzYDAcuduRmdHtnrZRJ7CbvjzdQhC45e' +
        'wwvQeuqbM2dNwS9RCf6buUJGu6N3rBy6oLSpMwha8tc'
};
exports.controllerDoc2020 = {
    '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
    ],
    id: 'https://example.edu/issuers/565049',
    assertionMethod: [exports.mockPublicKey2020]
};
exports.controllerDoc2018 = {
    '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2018/v1'
    ],
    id: 'https://example.edu/issuers/565049',
    assertionMethod: [exports.mockPublicKey2018]
};
exports.credential = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        {
            AlumniCredential: 'https://schema.org#AlumniCredential',
            alumniOf: 'https://schema.org#alumniOf'
        },
        'https://w3id.org/security/suites/ed25519-2020/v1'
    ],
    id: 'http://example.edu/credentials/1872',
    type: ['VerifiableCredential', 'AlumniCredential'],
    issuer: 'https://example.edu/issuers/565049',
    issuanceDate: '2010-01-01T19:23:24Z',
    credentialSubject: {
        id: 'https://example.edu/students/alice',
        alumniOf: 'Example University'
    }
};
