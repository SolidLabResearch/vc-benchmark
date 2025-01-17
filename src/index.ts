import {performance} from "node:perf_hooks";
import * as fs from "node:fs";
import path from "node:path";
import {zkpld} from "./experiment";
import {readJsonFile} from "./utils/io";
import {logv2} from "./utils/log";
import {credentialSetups} from "./credentialSetups";
import {ICredentialSetup} from "./interfaces";
import {Implementation_BbsTermwiseSignature2023} from "./suite-implementations/bbs-termwise-signature-2023";
import {BbsTermwiseSignature2023Experiment} from "./experiment/bbsTermwiseSignature2023Experiment";
import {BbsBlsSignature2020Experiment} from "./experiment/bbsBlsSignature2020Experiment";


const implementationRunners = {
  async *[Symbol.asyncIterator]() {
    // bbs-termwise-signature 2023 with original test credential setup
    // yield { i: zkpld, ...credentialSetups['zkpld-vc0'] } // Will fail! See zkpld-vc0/meta/note in credentialSetups.
    // yield { i: zkpld, ...credentialSetups['vc00'] } // TODO: fix -  RDFProofsError(BBSPlus(InvalidSignature))
    yield { i: zkpld, ...credentialSetups['vc01'] } // Works
    yield { i: zkpld, ...credentialSetups['vc03'] } // Works
    // yield { i: bbsSignature2020, ...credentialSetups['vc00'] }
    // yield { i: ed25519Signature2020, ...credentialSetups['vc00'] }
    // yield { i: ecdsaSd2023Cryptosuite, ...credentialSetups['vc00'] }
  }
}

async function runBatch(n: number) {
  const batchTimestamp = Math.floor(Date.now() / 1000)

  let errors = []
  for await (const {i, credential: cPath, disclosureDocument: dPath} of implementationRunners) {

    const credential = readJsonFile(cPath.toString())
    const disclosureDocument = readJsonFile(dPath.toString())
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
        console.error(`Error occurred (iteration: ${j}/${n - 1}):\n`, e)
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

// const a =
const b_vc01 = new BbsBlsSignature2020Experiment(credentialSetups['vc01']) // TODO: verification of derived fails
const b_own = new BbsBlsSignature2020Experiment(credentialSetups['bbs-vc0']) // Works


async function runExperimentInstances() {
  let allOk = true;
  try {
    await (new BbsTermwiseSignature2023Experiment(credentialSetups['vc01'])).run()
    await (new BbsBlsSignature2020Experiment(credentialSetups['bbs-vc0'])).run()
  }
  catch (err) {
    allOk = false;
    console.error(`Error occurred while runExperimentInstances(): ${err}. Details:\n`, err)
  } finally {
    if(!allOk)
      console.error('SOMETHING WENT WRONG in runExperimentInstances()')
    else
      console.log('runExperimentInstances() executed without errors! :)')
  }
}
runExperimentInstances().then().catch(console.error)
