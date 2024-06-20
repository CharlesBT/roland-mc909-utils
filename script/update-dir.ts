import { useMC909Samples } from '../src/useMC909Samples.js'

const SAMPLE_ROOT_DIR = 'H:/__TEST'

const MC909Samples = useMC909Samples()
MC909Samples.updateDir(SAMPLE_ROOT_DIR)
MC909Samples.renameFiles(SAMPLE_ROOT_DIR, 10)
