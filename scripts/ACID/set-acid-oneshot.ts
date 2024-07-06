import { useACIDSamples } from '../../src/useACIDSamples.js'
import { writeReport } from '../../src/report.js'

const SAMPLE_ROOT_DIR = 'H:/_ACID'

const acidSamples = useACIDSamples()
/*
  type: 0 = ACIDized loops, 1 = One-Shot, 28 = ACID Beatmapped
  beats: number of beats used fot ACIDized loops
  tempo: tempo used for ACID Beatmapped
*/
acidSamples.updateDirWithAcidChunk(SAMPLE_ROOT_DIR, 1)

writeReport()
