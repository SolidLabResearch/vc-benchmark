import {DisclosureFormat, ICredentialSetup} from "./interfaces";

export const credentialSetups: Record<string, ICredentialSetup> = {
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

  'vc01': {
    'credential': 'src/resources/credentials/vc01.json',
    'disclosureDocument': 'src/resources/credentials/vc01-disclosure-document.json',
    disclosureFormat: DisclosureFormat.frame
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
  }
}
