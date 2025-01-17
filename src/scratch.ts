import fs from 'fs'
import {readJsonFile, writeJsonFile} from "./utils/io";
import {unsigned, derivationFrame} from "./resources/bbs-bls-signature-2020/demo-pseudonymity/data";
console.log('scratch.ts')


writeJsonFile('src/resources/bbs-bls-signature-2020/bbs-vc0.json', unsigned)
writeJsonFile('src/resources/bbs-bls-signature-2020/bbs-vc0-disclosure-document.json', derivationFrame)

