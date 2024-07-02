import path from 'node:path'
import { useMC909Samples } from '../../src/useMC909Samples.js'

const SAMPLE_ROOT_DIR = path.normalize('H:/_MC909')

const MC909Samples = useMC909Samples()
MC909Samples.countSampleSlots(SAMPLE_ROOT_DIR)
