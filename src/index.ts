import {performance} from "node:perf_hooks";
import * as fs from "node:fs";
import path from "node:path";
import {bbsSignature2020, ecdsaSd2023Cryptosuite, ed25519Signature2020, zkpld} from "./experiment";

const implementationRunners = [
  zkpld,
  bbsSignature2020,
  ed25519Signature2020,
  ecdsaSd2023Cryptosuite
]

async function runBatch(n: number) {
  const batchTimestamp = Math.floor(Date.now() / 1000)

  let errors = []
  for await (const i of implementationRunners) {
    console.log(`🅰️crypto suite: ${i.cryptosuite}`)
    const cs = Object(i).cryptosuite as string

    for (let j = 0; j < n; j++) {
      console.log(`\t🅱️ iteration j: ${j}`)
      const experimentTag = `${cs}-${j}`
      try {
        // Clear any existing performance records
        performance.clearMarks()

        // Execute implementation i for the j-th time
        await i.main()

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
const batchSize = 2
runBatch(batchSize).then().catch(console.error)
