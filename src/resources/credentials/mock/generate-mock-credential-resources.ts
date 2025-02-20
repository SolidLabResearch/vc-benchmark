import fs from 'fs'
import process from 'process'
import path from 'path'
import {readJsonFile, writeJsonFile} from '../../../utils/io'
import {klona} from 'klona'
import {DisclosureFormat} from "../../../interfaces";

function createKeyValuePairs(count: number): Record<string, string> {
  const result: Record<string, string> = {};

  for (let i = 1; i <= count; i++) {
      result[`attribute${i}`] = `value${i}`;
  }

  return result;
}

console.log('Generating mock credential resources')

const parentDir = './src/resources/credentials/mock'

const fpathBaseCredential = path.resolve(parentDir, 'vc_base.json')

const baseCredential = readJsonFile(fpathBaseCredential)

const nTotalAttributes = 2048

const credentialSetupRecords : Record<string, any> = {}
// 'mock-vc_008-sd-002-att': {
//   key: 'mock-vc_008-sd-002-att',
//     credential: 'vc_008.json',
//     disclosureDocument: 'vc_008-sd-002-att.json',
//     disclosureFormat: DisclosureFormat.frame
// },
// Iterate over the range of total number of attributes
for (let i = 2; i <= nTotalAttributes; i*=2) {
  let ci = klona(baseCredential)
  ci['credentialSubject'] = {
    'id': 'did:example:subject123',
    ...createKeyValuePairs(i)
  }

  // Write input credential
  const fnameCredential = `vc_${i.toString().padStart(3, '0')}.json`
  const fpathCredential = path.resolve(parentDir, fnameCredential)
  writeJsonFile(fpathCredential, ci)

  // Iterate over the number of disclosed attribtues
  for (let j = 2; j <= i; j*=2) {
    console.log({i,j})
    // disclosure document
    let di = klona(ci)
    const diCs =
    Object.fromEntries(
      Object
        .entries(di.credentialSubject)
        .slice(undefined,j)
        .map(([k,v])=>[k,{}])
    )
    console.log({diCs})
    di.credentialSubject = {
      '@explicit': true,
      'id': 'did:example:subject123',
      ...diCs
    }


    const bnameDisclosureDocument = `vc_${i.toString().padStart(3, '0')}-sd-${j.toString().padStart(3, '0')}-att`
    const fnameDisclosureDocument = `${bnameDisclosureDocument}.json`
    const fpathDisclosureDocument = path.resolve(parentDir, fnameDisclosureDocument)
    // Write disclosure document
    writeJsonFile(fpathDisclosureDocument, di)
    // Push credential setup record
    credentialSetupRecords[`mock-${bnameDisclosureDocument}`] = {
      key: `mock-${bnameDisclosureDocument}`,
      credential: fnameCredential,
      disclosureDocument: fnameDisclosureDocument,
      disclosureFormat: DisclosureFormat.frame
    }
  }
}

writeJsonFile(path.resolve(parentDir, 'credentialSetupRecords.json'), credentialSetupRecords)
