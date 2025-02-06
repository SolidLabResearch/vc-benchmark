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
    // For each experiment constructor (ectr)
    for await (const ectr of experimentCtrs) {
      try {
        // Instantiate experiment
        const e = new ectr(credentialSetup)

        // Assert that the actual nr of disclosed attributes is correct
        const match = credentialSetup.key.match(/\b\d{3}\b/);
        const nrDisclosedAttributesInKey = match ? Number(match[0]) : null;
        logv2({
          nrDisclosedAttributesInKey,
          nrDisclosedCredentialSubjectAttributes: e.nrDisclosedCredentialSubjectAttributes
        })
        assert(nrDisclosedAttributesInKey === e.nrDisclosedCredentialSubjectAttributes)

        // Execute the experiment and obtain the run result records
        let rr: IRunResult = await e.run()
        rr.iteration = i
        rrRecords.push(rr)
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
  }

  // Write errors to file.
  if (errors.length > 0) {
    console.error(`A total of ${errors.length} errors occurred!`)
    fs.writeFileSync(path.join('data', 'errors.json'), JSON.stringify(errors))
  } else {
    console.log('No errors occurred!')
  }

  return rrRecords
}

const experimentConstructors = [
  BbsBlsSignature2020Experiment,
  BbsTermwiseSignature2023Experiment,
  Ed25519Signature2020Experiment,
  EcdsaSd2023CryptosuiteExperiment
]
const nExperimentIterations = 2
const credentialSetupKeys = [
  'vc01-sd-002-att',
  'vc02-sd-002-att',

  'Iso18013DriversLicenseCredential-sd-002-att',
  'Iso18013DriversLicenseCredential-sd-004-att',
  'Iso18013DriversLicenseCredential-sd-008-att',
  'Iso18013DriversLicenseCredential-sd-016-att',

  // 'jcan-20bnclaims-sd-002-att',
  // 'jcan-20bnclaims-sd-004-att',
  // 'jcan-20bnclaims-sd-008-att',
  // 'jcan-20bnclaims-sd-016-att',

]

async function runExperimentsOnCS(
  experimentCtrs: SubclassOfAbstractExperiment<any>[],
  csKeys: string[],
  n: number
) {
  const allRecords = []
  for await (const cski of csKeys) {
    const csi = credentialSetups[cski]

    console.log(
      `Running experiments with parameters:
      implementations:\n\t${experimentCtrs.map(c => c.name).join('\n\t')}
      credentialSetup: ${cski}
      credential: ${csi.credential}
      disclosureDocument: ${csi.disclosureDocument}
      n. iterations: ${n}
    `)

    const rri = await runExperiments(experimentCtrs, csi, n)
    allRecords.push(...rri)
  }
  // Export result records
  fs.writeFileSync(path.join('data', 'records.json'), JSON.stringify(allRecords))
}


runExperimentsOnCS(experimentConstructors, credentialSetupKeys, nExperimentIterations)
.then().catch(console.error)
