import { useACIDSamples } from '../../src/useACIDSamples.js'
import { writeReport } from '../../src/report.js'

const SAMPLE_ROOT_DIR = 'H:/_ACID'

const acidSamples = useACIDSamples()
/*
  tempo: tempo used for ACID Beatmapped
*/
acidSamples.checkDirLoopTempo(SAMPLE_ROOT_DIR, 170)

writeReport()
