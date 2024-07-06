import { useMC909Samples } from '../../src/useMC909Samples.js'
import { writeReport } from '../../src/report.js'

const SAMPLE_ROOT_DIR = 'H:/_MC909'

const MC909Samples = useMC909Samples()
MC909Samples.checkFilenames(SAMPLE_ROOT_DIR)

writeReport()