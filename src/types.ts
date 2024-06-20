export type LoopPoint = { dwStart: number; dwEnd: number }

export type smpl = { loops: LoopPoint[]; dwNumSampleLoops?: number }

export type FMT = {
  audioFormatValue?: number
  channels?: number
  sampleRate?: number
  byteRate?: number
  blockAlign?: number
  bitsPerSample?: number
  extraParamSiz?: number
  extraParams?: number
}

export type ACID = {
  type: number
  rootNote: number
  unknown1: number
  unknown2: number
  beats: number
  meterDenominator: number
  meterNumerator: number
  tempo: number
}
