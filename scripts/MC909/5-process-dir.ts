import { useMC909Samples } from '../../src/useMC909Samples.js'

const SAMPLE_ROOT_DIR = 'H:/_MC909'

const MC909Samples = useMC909Samples()
MC909Samples.updateDirWithRolandChunk(SAMPLE_ROOT_DIR)
MC909Samples.renameFiles(SAMPLE_ROOT_DIR, 3) // starting to 3 to keep an empty slot for stereo sampling
