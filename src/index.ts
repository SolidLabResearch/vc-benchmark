import {performance} from "node:perf_hooks";
import * as fs from "node:fs";
import path from "node:path";
import {bbsSignature2020, ecdsaSd2023Cryptosuite, ed25519Signature2020, zkpld} from "./experiment";
import {readJsonFile} from "./utils/io";
import {logv2} from "./utils/log";


const credentialSetups = {
  'zkpld-vc0': {
    'credential': 'src/resources/zkp-ld/vc0.json',
    'disclosureDocument': 'src/resources/zkp-ld/disclosed0.json'
  },
  'vc00': {
    'credential': 'src/resources/credentials/vc00.json',
    'disclosureDocument': 'src/resources/credentials/vc00-disclosure-document.json'
  },
  'vc01': {
    'credential': 'src/resources/credentials/vc01.json',
    'disclosureDocument': 'src/resources/credentials/vc01-disclosure-document.json'
  }
}
const implementationRunners = {
  async *[Symbol.asyncIterator]() {
    // bbs-termwise-signature 2023 with original test credential setup
    yield { i: zkpld, ...credentialSetups['zkpld-vc0'] }
    yield { i: zkpld, ...credentialSetups['vc00'] } // TODO: fix -  RDFProofsError(BBSPlus(InvalidSignature))
    yield { i: zkpld, ...credentialSetups['vc01'] } // TODO: fix - TypeError: json-diff error
    // yield { i: bbsSignature2020, ...credentialSetups['vc00'] }
    // yield { i: ed25519Signature2020, ...credentialSetups['vc00'] }
    // yield { i: ecdsaSd2023Cryptosuite, ...credentialSetups['vc00'] }
  }
}

async function runBatch(n: number) {
  const batchTimestamp = Math.floor(Date.now() / 1000)

  let errors = []
  for await (const {i, credential: cPath, disclosureDocument: dPath} of implementationRunners) {

    const credential = readJsonFile(cPath)
    const disclosureDocument = readJsonFile(dPath)
    logv2(credential, 'credential')
    logv2(disclosureDocument, 'disclosureDocument')
    console.log(`
    🅰️crypto suite: ${i.cryptosuite}
    c: ${cPath}
    d: ${dPath}`)

    const cs = Object(i).cryptosuite as string

    for (let j = 0; j < n; j++) {
      console.log(`\t🅱️ iteration j: ${j}`)
      const experimentTag = `${cs}-${j}`
      try {
        // Clear any existing performance records
        performance.clearMarks()

        // Execute implementation i for the j-th time
        await i.main(credential, disclosureDocument)

        // Export performance records
        const records = performance.getEntries();
        console.log('n records: ', records.length)
        const dataToExport = {
          records,
          nRecords: records.length,
          experimentTag,
          iteration: j,
          batchTimestamp
        }

        const fname = `performanceRecords_${batchTimestamp}_${experimentTag}.json`
        fs.writeFileSync(path.join('data', fname), JSON.stringify(dataToExport))

      } catch (e) {
        console.error(`Error occurred (iteration: ${j}/${n - 1})`, e)
        errors.push({error: e, experimentTag, iteration: j, n})
      }
    }
  }
  if (errors.length > 0) {
    console.error(`A total of ${errors.length} errors occurred!`)
    fs.writeFileSync(path.join('data', 'errors.json'), JSON.stringify(errors))
  } else {
    console.log('No errors occurred!')
  }
}

// Driver
const batchSize = 1
runBatch(batchSize).then().catch(console.error)
