import * as fs from "node:fs";
import path from "node:path";
import {logv2} from "./utils/log";
import {credentialSetups} from "./credentialSetups";
import {ICredentialSetup, IRunResult, SubclassOfAbstractExperiment} from "./interfaces";
import {BbsTermwiseSignature2023Experiment} from "./experiment/bbsTermwiseSignature2023Experiment";
import {BbsBlsSignature2020Experiment} from "./experiment/bbsBlsSignature2020Experiment";
import {Ed25519Signature2020Experiment} from "./experiment/Ed25519Signature2020Experiment";
import {EcdsaSd2023CryptosuiteExperiment} from "./experiment/EcdsaSd2023CryptosuiteExperiment";
import assert from "node:assert";
// @ts-ignore
import yargs from 'yargs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const argv=yargs(process.argv.slice(2)).argv;
const {dbName, N} = argv
const fpathDB = (dbName === undefined ? `data/db-${Date.now()}.json` : `${dbName}.json`)
console.log({fpathDB, N })
const adapter = new JSONFile<IRunResult[]>(fpathDB);
const db = new Low(adapter, []);

/**
 * Write RunResult to DB
 * @param rr
 */
async function writeRunResult(rr: IRunResult) {
  await db.read()
  db.data.push(rr)
  await db.write()
}

/**
 * Executes the given set of experiments,
 * on a given credential setup,
 * for a given number of iterations.
 * @param experimentCtrs: a subclass of AbstractExperiment (i.e. concrete experiment)
 * @param credentialSetupKey: a string referring to the credential setup to be used (i.e., which credential serves as input, as well the disclosure document.
 */
async function runExperiments(
  experimentCtrs: SubclassOfAbstractExperiment<any>[],
  credentialSetup: ICredentialSetup,
  n: number
) {
  const errors = []
  const rrRecords: IRunResult[] = []
  for(let i = 0; i < n; i++) {
    const tiStart = Date.now()
    console.log(
      `Experiment iteration ${i}/${n} - ${Date.now()}`
    )
    // For each experiment constructor (ectr)
    for await (const ectr of experimentCtrs) {
      try {
        // Instantiate experiment
        const e = new ectr(credentialSetup)

        // Assert that the actual nr of disclosed attributes is correct
        const match = credentialSetup.key.split('sd-')[1].match(/\b\d{3}\b/);

        const nrDisclosedAttributesInKey = match ? Number(match[0]) : null;
        logv2({
          nrDisclosedAttributesInKey,
          nrDisclosedCredentialSubjectAttributes: e.nrDisclosedCredentialSubjectAttributes
        })
        assert(nrDisclosedAttributesInKey === e.nrDisclosedCredentialSubjectAttributes)

        // Execute the experiment and obtain the run result records
        const runStart = Date.now()
        let rr: IRunResult = await e.run()
        rr.end = Date.now()
        rr.start = runStart
        rr.iteration = i
        // rrRecords.push(rr)
        await writeRunResult(rr)
      }
      catch (err) {
        console.log(`ERROR while running following experiment: ${ectr.name}`)
        console.log(err)
        errors.push({
          error: err,
          experiment: ectr.name,
          iteration: i,
          credentialSetupKey: credentialSetup.key
        })
      }
    }
    const tiEnd = Date.now()
    const tiDelta = tiEnd - tiStart
    console.log(
      `⏱️Experiment iteration ${i}/${n} took ${tiDelta}ms`
    )
  }

  // Write errors to file.
  if (errors.length > 0) {
    console.error(`A total of ${errors.length} errors occurred!`)
    fs.writeFileSync(path.join( 'data', 'errors.json'), JSON.stringify(errors))
  } else {
    console.log('No errors occurred!')
  }

  return rrRecords
}

/**
 * Executes the given set of experiments,
 * on a given credential setup,
 * for a given number of iterations.
 * @param experimentCtrs: a subclass of AbstractExperiment (i.e. concrete experiment)
 * @param credentialSetupKey: a string referring to the credential setup to be used (i.e., which credential serves as input, as well the disclosure document.
 */
async function runExperimentsParallel(
  experimentCtrs: SubclassOfAbstractExperiment<any>[],
  credentialSetup: ICredentialSetup,
  n: number
) {

  const rrRecordPromises: Promise<IRunResult>[] = []
  // For-loop: n-iterations
  for(let i = 0; i < n; i++) {
    const tiStart = Date.now()
    console.log(
      `Experiment iteration ${i}/${n} - ${Date.now()}`
    )
    // For each: experiment constructor (ectr)
    for await (const ectr of experimentCtrs) {

      rrRecordPromises.push(
        new Promise<IRunResult>(async (resolve, reject) => {
          try {
            // Instantiate experiment
            const e = new ectr(credentialSetup)

            // Assert that the actual nr of disclosed attributes is correct
            const match = credentialSetup.key.split('sd-')[1].match(/\b\d{3}\b/);

            const nrDisclosedAttributesInKey = match ? Number(match[0]) : null;
            logv2({
              nrDisclosedAttributesInKey,
              nrDisclosedCredentialSubjectAttributes: e.nrDisclosedCredentialSubjectAttributes
            })
            assert(nrDisclosedAttributesInKey === e.nrDisclosedCredentialSubjectAttributes)

            // Execute the experiment and obtain the run result records
            const runStart = Date.now()
            let rr: IRunResult = await e.run()
            rr.end = Date.now()
            rr.start = runStart
            rr.iteration = i
            resolve(rr)
          }
          catch (err) {
            console.log(`ERROR while running following experiment: ${ectr.name}`)
            console.log(err)
            reject({
              error: err,
              experiment: ectr.name,
              iteration: i,
              credentialSetupKey: credentialSetup.key
            })
          }
        })
      )


    }
    const tiEnd = Date.now()
    const tiDelta = tiEnd - tiStart
    console.log(
      `⏱️Experiment iteration ${i}/${n} took ${tiDelta}ms`
    )
  }


  return rrRecordPromises
}

const experimentConstructors = [
  BbsBlsSignature2020Experiment,
  BbsTermwiseSignature2023Experiment,
  Ed25519Signature2020Experiment,
  EcdsaSd2023CryptosuiteExperiment
]
// Default: 10
const nExperimentIterations = N !== undefined ? N : 10;
const credentialSetupKeys = [
  // 'vc01-sd-002-att',
  // 'vc02-sd-002-att',

  // 'Iso18013DriversLicenseCredential-sd-002-att',
  // 'Iso18013DriversLicenseCredential-sd-004-att',
  // 'Iso18013DriversLicenseCredential-sd-008-att',
  // 'Iso18013DriversLicenseCredential-sd-016-att',

  'mock-vc_002-sd-002-att',

  'mock-vc_004-sd-002-att',
  'mock-vc_004-sd-004-att',

  'mock-vc_008-sd-002-att',
  'mock-vc_008-sd-004-att',
  'mock-vc_008-sd-008-att',

  'mock-vc_016-sd-002-att',
  'mock-vc_016-sd-004-att',
  'mock-vc_016-sd-008-att',
  'mock-vc_016-sd-016-att',

  'mock-vc_032-sd-002-att',
  'mock-vc_032-sd-004-att',
  'mock-vc_032-sd-008-att',
  'mock-vc_032-sd-016-att',
  'mock-vc_032-sd-032-att',

  'mock-vc_064-sd-002-att',
  'mock-vc_064-sd-004-att',
  'mock-vc_064-sd-008-att',
  'mock-vc_064-sd-016-att',
  'mock-vc_064-sd-032-att',
  'mock-vc_064-sd-064-att',

  'mock-vc_256-sd-002-att',
  'mock-vc_256-sd-004-att',
  'mock-vc_256-sd-008-att',
  'mock-vc_256-sd-016-att',
  'mock-vc_256-sd-032-att',
  'mock-vc_256-sd-064-att',
  'mock-vc_256-sd-128-att',
  'mock-vc_256-sd-256-att',

  'mock-vc_512-sd-002-att',
  'mock-vc_512-sd-004-att',
  'mock-vc_512-sd-008-att',
  'mock-vc_512-sd-016-att',
  'mock-vc_512-sd-032-att',
  'mock-vc_512-sd-064-att',
  'mock-vc_512-sd-128-att',
  'mock-vc_512-sd-256-att',
  'mock-vc_512-sd-512-att',

  'mock-vc_1024-sd-002-att',
  'mock-vc_1024-sd-004-att',
  'mock-vc_1024-sd-008-att',
  'mock-vc_1024-sd-016-att',
  'mock-vc_1024-sd-032-att',
  'mock-vc_1024-sd-064-att',
  'mock-vc_1024-sd-128-att',
  'mock-vc_1024-sd-256-att',
  'mock-vc_1024-sd-512-att',
  // * // 'mock-vc_1024-sd-1024-att',

  'mock-vc_2048-sd-002-att',
  'mock-vc_2048-sd-004-att',
  'mock-vc_2048-sd-008-att',
  'mock-vc_2048-sd-016-att',
  'mock-vc_2048-sd-032-att',
  'mock-vc_2048-sd-064-att',
  'mock-vc_2048-sd-128-att',
  'mock-vc_2048-sd-256-att',
  'mock-vc_2048-sd-512-att',
  // * // 'mock-vc_2048-sd-1024-att',
  // * // 'mock-vc_2048-sd-2048-att'

]

async function runExperimentsOnCS(
  experimentCtrs: SubclassOfAbstractExperiment<any>[],
  csKeys: string[],
  n: number
) {
  const allRecords = []
  try {
    for await (const cski of csKeys) {
      const csi = credentialSetups[cski]
      console.log({cski,csi})
      if (csi === undefined)
        throw new Error(`Current CredentialSetup is undefined! (key: ${cski})`)

      console.log(
          `Running experiments with parameters:
        implementations:\n\t${experimentCtrs.map(c => c.name).join('\n\t')}
        credentialSetup: ${cski}
        credential: ${csi.credential}
        disclosureDocument: ${csi.disclosureDocument}
        n. iterations: ${n}
      `)

      const rri = await runExperiments(experimentCtrs, csi, n)
      // const rri = await Promise.all((await runExperimentsParallel(experimentCtrs, csi, n)))

      //allRecords.push(...rri) // TODO: Delete when chosen for lowdb
    }
  } catch (error) {
    console.error(error)
  }

  // Export result records
  //fs.writeFileSync(path.join('data', 'records.json'), JSON.stringify(allRecords)) // TODO: Delete when chosen for lowdb
}

async function main() {
  const tStart = Date.now()
  const {cskIndexA, cskIndexB} = argv
  const cskSubset = (cskIndexA!==undefined && cskIndexB!==undefined)?credentialSetupKeys.slice(cskIndexA, cskIndexB) : credentialSetupKeys
  console.log({cskSubset})
  await runExperimentsOnCS(
    experimentConstructors,cskSubset, nExperimentIterations)
  const tDelta = Date.now() - tStart
  console.log(`main() - ∆t: ${tDelta} [ms] (${tDelta/1000} [s])`)
}

main().then().catch(console.error)
