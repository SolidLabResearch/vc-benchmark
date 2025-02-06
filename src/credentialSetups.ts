import {DisclosureFormat, ICredentialSetup} from "./interfaces";
import path from 'path'

/**
 * walt.id credentials
 */
namespace waltid {
  export const parentDir = 'src/resources/credentials/waltid'
  export const credentialSetups  = Object.fromEntries(
    Object.entries(
      {
        'Iso18013DriversLicenseCredential-sd-002-att': {
          key: 'Iso18013DriversLicenseCredential-sd-002-att',
          credential: 'Iso18013DriversLicenseCredential.json',
          disclosureDocument: 'Iso18013DriversLicenseCredential-sd-002-att.json',
          disclosureFormat: DisclosureFormat.frame
        },
        'Iso18013DriversLicenseCredential-sd-004-att': {
          key: 'Iso18013DriversLicenseCredential-sd-004-att',
          credential: 'Iso18013DriversLicenseCredential.json',
          disclosureDocument: 'Iso18013DriversLicenseCredential-sd-004-att.json',
          disclosureFormat: DisclosureFormat.frame
        },
        'Iso18013DriversLicenseCredential-sd-008-att': {
          key: 'Iso18013DriversLicenseCredential-sd-008-att',
          credential: 'Iso18013DriversLicenseCredential.json',
          disclosureDocument: 'Iso18013DriversLicenseCredential-sd-008-att.json',
          disclosureFormat: DisclosureFormat.frame
        },
        'Iso18013DriversLicenseCredential-sd-016-att': {
          key: 'Iso18013DriversLicenseCredential-sd-016-att',
          credential: 'Iso18013DriversLicenseCredential.json',
          disclosureDocument: 'Iso18013DriversLicenseCredential-sd-016-att.json',
          disclosureFormat: DisclosureFormat.frame
        }
      }

    ).map(([key, value]) => {
      value.credential = path.resolve(waltid.parentDir, value.credential);
      value.disclosureDocument = path.resolve(waltid.parentDir, value.disclosureDocument);
      return [key , value];
    })
  )
}

namespace jcan {
  export const parentDir = 'src/resources/credentials/jcan'
  export const credentialSetups =Object.fromEntries(
    Object.entries(
      {
        'jcan-20bnclaims-sd-002-att': {
          key: 'jcan-sd-002-att',
          credential: 'output/20_perBNclaims.json',
          disclosureDocument: 'jcan-20bnclaims-sd-002-att.json',
          disclosureFormat: DisclosureFormat.frame
        },
        'jcan-20bnclaims-sd-004-att': {
          key: 'jcan-sd-004-att',
          credential: 'output/20_perBNclaims.json',
          disclosureDocument: 'jcan-20bnclaims-sd-004-att.json',
          disclosureFormat: DisclosureFormat.frame
        },
        'jcan-20bnclaims-sd-008-att': {
          key: 'jcan-sd-008-att',
          credential: 'output/20_perBNclaims.json',
          disclosureDocument: 'jcan-20bnclaims-sd-008-att.json',
          disclosureFormat: DisclosureFormat.frame
        },
        'jcan-20bnclaims-sd-016-att': {
          key: 'jcan-sd-016-att',
          credential: 'output/20_perBNclaims.json',
          disclosureDocument: 'jcan-20bnclaims-sd-016-att.json',
          disclosureFormat: DisclosureFormat.frame
        }
      }

    ).map(([key, value]) => {
      value.credential = path.resolve(jcan.parentDir, value.credential);
      value.disclosureDocument = path.resolve(jcan.parentDir, value.disclosureDocument);
      return [key , value];
    })
  )
}

const _credentialSetups = {
  ...jcan.credentialSetups,
  ...waltid.credentialSetups,
  'zkpld-vc0': {
    'credential': 'src/resources/zkp-ld/vc0.json',
    'disclosureDocument': 'src/resources/zkp-ld/disclosed0.json',
    'disclosureFormat': DisclosureFormat.custom,
    'meta': {
      'note': 'Applying the disclosure document as JSON-LD Frame for the credential will result in errors.'
    }
  },

  'vc00': {
    'credential': 'src/resources/credentials/vc00.json',
    'disclosureDocument': 'src/resources/credentials/vc00-disclosure-document.json',
    disclosureFormat: DisclosureFormat.frame
  },

  'vc01-sd-002-att': {
    key: 'vc01-sd-002-att',
    credential: 'src/resources/credentials/vc01.json',
    'disclosureDocument': 'src/resources/credentials/vc01-disclosure-document.json',
    disclosureFormat: DisclosureFormat.frame
  },

  'vc02-sd-002-att': {
    key: 'vc02-sd-002-att',
    'credential': 'src/resources/credentials/vc02.json',
    'disclosureDocument': 'src/resources/credentials/vc02-disclosure-document.json',
    disclosureFormat: DisclosureFormat.frame,
    'meta': {
      'sources': {
        'credential': 'https://github.com/zkp-ld/jsonld-proofs/blob/main/tests/example/vc2.json',
        'disclosureDocument': 'https://github.com/zkp-ld/jsonld-proofs/blob/main/tests/example/disclosed2.json'
      }
    },
  },

  'vc03': {
    'meta': {
      'sources': {
        'credential': 'https://github.com/zkp-ld/jsonld-proofs/blob/main/tests/example/vc3.json',
        'disclosureDocument': 'https://github.com/zkp-ld/jsonld-proofs/blob/main/tests/example/disclosed3.json'
      }
    },
    'credential': 'src/resources/credentials/vc03.json',
    'disclosureDocument': 'src/resources/credentials/vc03-disclosure-document.json',
    disclosureFormat: DisclosureFormat.frame
  },

  'bbs-vc0': {
    'credential': 'src/resources/bbs-bls-signature-2020/bbs-vc0.json',
    'disclosureDocument': 'src/resources/bbs-bls-signature-2020/bbs-vc0-disclosure-document.json',
    disclosureFormat: DisclosureFormat.frame
  }
}
export const credentialSetups: Record<string, ICredentialSetup> = Object.fromEntries(
  Object.entries(_credentialSetups)
    .map(([key, value]) => [key, {key, ...value}])
)
