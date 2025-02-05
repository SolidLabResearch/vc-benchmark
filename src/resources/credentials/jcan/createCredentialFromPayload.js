console.log('createCredentialFromPayload.js');
import fs from 'fs';
import path from 'path';
import util from "node:util";
export function logv2(obj, tag = undefined) {
  if(!!tag)
      console.log(tag, util.inspect(obj,{showHidden: false, depth: null, colors: true}))
  else
      console.log(util.inspect(obj,{showHidden: false, depth: null, colors: true}))

}

const parentDir = './src/resources/credentials/jcan';
const fnamePayload = '20_perBNclaims.json'
const fpathPayload = path.resolve(parentDir, 'payloads', fnamePayload);
const fpathTargetCredential = path.resolve(parentDir, 'output', fnamePayload);

const payload = JSON.parse(fs.readFileSync(fpathPayload, 'utf-8'));
logv2(payload, 'payload')

let vc = {}
vc['@context'] = []
vc['@context'].push("https://www.w3.org/2018/credentials/v1");
vc['@context'].push("https://schema.org/")
vc['type'] = [ 'VerifiableCredential' ]
logv2(payload, 'payload')
vc['credentialSubject'] = payload
logv2(vc, 'vc')

console.log(`Writing to: ${fpathTargetCredential}`)
fs.writeFileSync(fpathTargetCredential, JSON.stringify(vc, null, 2), 'utf8')


/*
let vc = JSON.parse(fs.readFileSync(path.resolve(fpathTargetCredential), 'utf-8'))
vc['@context'].push("https://schema.org/")
vc.credentialSubject = payload
logv2(vc, 'vc')
*/
