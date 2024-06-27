import path from 'node:path'
import fse from 'fs-extra'
import { useMC909Samples } from '../src/useMC909Samples.js'

const SAMPLE_ROOT_DIR = path.normalize('H:/__TEST')
const TEMP_ROOT_DIR = path.normalize('H:/__TMP')

const MC909Samples = useMC909Samples()
const files = MC909Samples.getListOfMonoWith2Channels(SAMPLE_ROOT_DIR)

for (const file of files) {
  const dest = file.replace(SAMPLE_ROOT_DIR, TEMP_ROOT_DIR)
  const dir = path.dirname(dest)
  fse.ensureDirSync(dir)
  fse.copySync(file, dest)
}
