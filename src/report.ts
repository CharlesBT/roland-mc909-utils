import fs from 'node:fs'
import path from 'node:path'

const LOG_FILE = 'report.log'

let out = ''

export function log(text: string) {
  out += `${text}\r\n`
  console.info(text)
}

export function writeReport(filename = LOG_FILE) {
  fs.writeFileSync(path.join(process.cwd(), filename), out)
}
