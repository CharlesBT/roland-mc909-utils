import fs from 'node:fs'
import * as midiManager from 'midi-file'
import type { MidiData, MidiEvent, MidiTrackNameEvent } from 'midi-file'

const TICKS_PER_BEAT = 480
const TRACK_SETUP_TICK_LENGTH = 1920

export function useMidifile() {
  const trackMap = new Map<string, string>()
  trackMap.set('Part.1', 'CH1')
  trackMap.set('Part.2', 'CH2')
  trackMap.set('Part.3', 'CH3')
  trackMap.set('Part.4', 'CH4')
  trackMap.set('Part.5', 'CH5')
  trackMap.set('Part.6', 'CH6')
  trackMap.set('Part.7', 'CH7')
  trackMap.set('Part.8', 'CH8')
  trackMap.set('Part.9', 'CH9')
  trackMap.set('Part.10', 'CH10')
  trackMap.set('Part.11', 'CH11')
  trackMap.set('Part.12', 'CH12')
  trackMap.set('Part.13', 'CH13')
  trackMap.set('Part.14', 'CH14')
  trackMap.set('Part.15', 'CH15')
  trackMap.set('Part.16', 'CH16')

  function checkMidiData(v: MidiData) {
    if (!(v.header && (v.header.format === 0 || v.header.format === 1 || v.header.format === 2)))
      throw new Error('BAD_MIDI_FILE:MIDI_FORMAT_NOT_FOUND')
    if (v.header.format !== 1) throw new Error('BAD_MIDI_FILE:MIDI_FORMAT_NOT_SUPPORTED')
  }

  function getMidiJsonFromFile(file: string): midiManager.MidiData {
    const input = fs.readFileSync(file) // Read MIDI file into a buffer
    return midiManager.parseMidi(input) // Convert buffer to midi object
  }

  function getMidiData(file: string): midiManager.MidiData {
    const midiData = getMidiJsonFromFile(file)
    if (!(midiData.header.numTracks > 0)) throw new Error('BAD_MIDI_FILE:MIDI_TRACK_NOT_FOUND')
    if (!(midiData.header.ticksPerBeat === TICKS_PER_BEAT))
      throw new Error('BAD_MIDI_FILE:MIDI_TICKSPERBEAT_NOT_SUPPORTED')
    checkMidiData(midiData)
    return midiData
  }

  function getMidiDataWithoutNoteEvent(file: string): midiManager.MidiData {
    const midiData = getMidiJsonFromFile(file)
    checkMidiData(midiData)
    if (!(midiData.header.numTracks === 18))
      throw new Error('BAD_MIDI_FILE:MIDI_NUMTRACKS_NOT_SUPPORTED')
    if (!(midiData.header.ticksPerBeat === TICKS_PER_BEAT))
      throw new Error('BAD_MIDI_FILE:MIDI_TICKSPERBEAT_NOT_SUPPORTED')
    const midiDataWithoutNoteEvent: MidiData = {
      header: midiData.header,
      tracks: [],
    }
    for (const track of midiData.tracks) {
      const trackWithoutNoteEvent: MidiEvent[] = []
      for (const event of track) {
        if (event.type !== 'noteOn' && event.type !== 'noteOff') {
          trackWithoutNoteEvent.push(event)
        }
      }
      midiDataWithoutNoteEvent.tracks.push(trackWithoutNoteEvent)
    }
    return midiDataWithoutNoteEvent
  }

  function writeMidiData(file: string, midiData: MidiData) {
    fs.writeFileSync(file, Buffer.from(midiManager.writeMidi(midiData)))
  }

  function getRefPatternInfo(midiData: MidiData) {
    if (!midiData.header) throw new Error('BAD_MIDI_FILE:MIDI_HEADER_NOT_FOUND')
    if (!midiData.header.ticksPerBeat) throw new Error('BAD_MIDI_FILE:MIDI_TICKSPERBEAT_NOT_FOUND')
    const ticksPerBeat = midiData.header.ticksPerBeat
    let ticks = 0
    for (const event of midiData.tracks[1]) {
      ticks += event.deltaTime
    }
    return {
      ticks,
      ticksPerBeat,
      beats: Math.round(ticks / ticksPerBeat),
      measures: Math.round(ticks / ticksPerBeat / 4),
    }
  }

  function getNewPatternInfo(midiData: MidiData) {
    if (!midiData.header) throw new Error('BAD_MIDI_FILE:MIDI_HEADER_NOT_FOUND')
    if (!midiData.header.ticksPerBeat) throw new Error('BAD_MIDI_FILE:MIDI_TICKSPERBEAT_NOT_FOUND')
    const ticksPerBeat = midiData.header.ticksPerBeat
    const maxTick = getMaxTickLength(midiData)
    return {
      ticks: maxTick,
      ticksPerBeat,
      beats: Math.round(maxTick / ticksPerBeat),
      measures: Math.round(maxTick / ticksPerBeat / 4),
    }
  }

  function removeEndOfTrackMidiEvent(midiEvent: MidiEvent[]): MidiEvent[] {
    return midiEvent.filter((event) => event.type !== 'endOfTrack')
  }

  function updatedTracktEndOfTrackWithPatternLength(
    midiEvent: MidiEvent[],
    patternLength: number,
  ): MidiEvent[] {
    const updatedTrack: MidiEvent[] = removeEndOfTrackMidiEvent(midiEvent)
    let delta = 0
    for (const event of updatedTrack) {
      delta += event.deltaTime
    }
    updatedTrack.push({
      deltaTime: patternLength - delta,
      meta: true,
      type: 'endOfTrack',
    })
    return updatedTrack
  }

  function getTrackName(midiEvent: MidiEvent[]) {
    for (const event of midiEvent) {
      if (event.type === 'trackName') {
        return (event as MidiTrackNameEvent).text
      }
    }
  }

  function getSetupData(midiEvent: MidiEvent[]): MidiEvent[] {
    const trackSetupData: MidiEvent[] = []
    let delta = 0
    for (const event of midiEvent) {
      delta += event.deltaTime
      if (delta >= TRACK_SETUP_TICK_LENGTH) return trackSetupData
      trackSetupData.push(event)
      // switch (event.type) {
      //   case 'trackName':
      //   case 'programChange':
      //   case 'controller':
      //     trackSetupData.push(event)
      //     break
      // }
    }
    return trackSetupData
  }

  function getNoteEventData(midiEvent: MidiEvent[]): MidiEvent[] {
    const noteEventData: MidiEvent[] = []
    let delta = 0
    for (const event of midiEvent) {
      delta += event.deltaTime
      switch (event.type) {
        case 'noteOn':
        case 'noteOff':
          noteEventData.push(event)
          break
      }
    }
    return noteEventData
  }

  function shiftTickEvent(midiEvent: MidiEvent[], ticks: number): MidiEvent[] {
    if (midiEvent.length > 0) midiEvent[0].deltaTime += ticks
    return midiEvent
  }

  function updateChannelNoteEventData(midiEvent: MidiEvent[], channel: number): MidiEvent[] {
    const updatedNoteEventData: MidiEvent[] = []
    for (const event of midiEvent) {
      if (event.type === 'noteOn' || event.type === 'noteOff') {
        updatedNoteEventData.push({
          deltaTime: event.deltaTime,
          channel,
          noteNumber: event.noteNumber,
          type: event.type,
          velocity: event.velocity,
        })
      }
    }
    return updatedNoteEventData
  }

  function getMaxTickLength(midiData: MidiData): number {
    let tickLength = 0
    for (const track of midiData.tracks) {
      let delta = 0
      for (const event of track) delta += event.deltaTime
      if (delta > tickLength) tickLength = delta
    }
    return tickLength
  }

  function getTickLength(midiEvent: MidiEvent[]): number {
    let delta = 0
    for (const event of midiEvent) delta += event.deltaTime
    return delta
  }

  function unMuteTrack(midiEvent: MidiEvent[]): MidiEvent[] {
    const events: MidiEvent[] = midiEvent
    for (const event of events) {
      if (event.type === 'controller') {
        // mixer mute/unmute CC
        if (event.controllerType === 88) event.value = 127
      }
    }
    return events
  }

  function getUpdatedMidiRefData(refData: MidiData, newData: MidiData): MidiData {
    function findTrackByName(midiData: MidiData, name: string) {
      for (const track of midiData.tracks) {
        let trackName = getTrackName(track)
        if (trackName) {
          trackName = trackName.split(' ')[0]
          if (trackName === name) return track
        }
      }
    }

    const updatedData: MidiData = {
      header: refData.header,
      tracks: [],
    }

    // update tempo and time signature track
    updatedData.tracks.push(refData.tracks[0])

    // pattern length
    const { measures } = getNewPatternInfo(newData)
    const patternTicks = measures * 4 * TICKS_PER_BEAT
    // console.info(`measures: ${measures}`)

    // update SysExPart track
    const updatedSysExTrack = updatedTracktEndOfTrackWithPatternLength(
      refData.tracks[1],
      TRACK_SETUP_TICK_LENGTH + patternTicks,
    )

    updatedData.tracks.push(updatedSysExTrack)

    for (const track of refData.tracks) {
      const trackName = getTrackName(track)
      if (trackName && trackName.startsWith('Part.')) {
        console.info(`Processing trackName: ${trackName}`)
        const channelNumber = parseInt(trackName.split('.')[1])
        const CHxx = trackMap.get(trackName)
        if (CHxx) {
          const foundNewTrack = findTrackByName(newData, CHxx)
          if (foundNewTrack) {
            const setupData = unMuteTrack(getSetupData(track))
            const shiftTicks = TRACK_SETUP_TICK_LENGTH - getTickLength(setupData)
            let noteEvents = getNoteEventData(foundNewTrack) // extract note only
            noteEvents = updateChannelNoteEventData(noteEvents, channelNumber - 1) // update channel number
            noteEvents = shiftTickEvent(noteEvents, shiftTicks) // delay notes from setup measure

            let updatedTrack = [...setupData, ...noteEvents]
            updatedTrack = updatedTracktEndOfTrackWithPatternLength(
              updatedTrack,
              TRACK_SETUP_TICK_LENGTH + patternTicks,
            )
            updatedData.tracks.push(updatedTrack)
            console.info(`note updated from ${CHxx}`)
          } else {
            // console.info(`Track: ${trackName} | CHxx: ${CHxx})'`)
            const updatedTrack = updatedTracktEndOfTrackWithPatternLength(
              track,
              TRACK_SETUP_TICK_LENGTH + patternTicks,
            )
            updatedData.tracks.push(updatedTrack)
          }
        }
      }
    }
    return updatedData
  }

  function getUpdatedMidiTemplateData(templateData: MidiData, patternData: MidiData): MidiData {
    const updatedData: MidiData = {
      header: patternData.header,
      tracks: patternData.tracks,
    }
    // update SysExPart track
    const templateSysExTrack = templateData.tracks[1]
    const updatedSysExEvents: MidiEvent[] = []
    for (const event of templateSysExTrack) {
      if (event.type !== 'endOfTrack') {
        updatedSysExEvents.push(event)
      }
    }
    const patternLength = getTickLength(patternData.tracks[1])
    const endOfTrackEvent: MidiEvent = {
      deltaTime: patternLength - getTickLength(updatedSysExEvents),
      meta: true,
      type: 'endOfTrack',
    }
    updatedSysExEvents.push(endOfTrackEvent)
    updatedData.tracks[1] = updatedSysExEvents
    return updatedData
  }

  function displayTrackInfo(midiData: MidiData) {
    for (const track of midiData.tracks) {
      const trackName = getTrackName(track)
      if (trackName) {
        console.info(`Track: ${trackName}, TickLength: ${getTickLength(track)}`)
      }
    }
  }

  return {
    getMidiData,
    getMidiDataWithoutNoteEvent,
    writeMidiData,
    checkMidiData,
    getRefPatternInfo,
    getNewPatternInfo,
    getUpdatedMidiRefData,
    getUpdatedMidiTemplateData,
    displayTrackInfo,
  }
}
