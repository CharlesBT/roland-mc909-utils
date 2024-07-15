# Roland MC-909 Groovebox Scripts Utilities for ACIDizing and preparing samples

## Description

This is a set of scripts for ACIDizing and preparing WAV files samples, oneshots and audio loops for Roland MC-909 Groovebox sampler.
Scripts solve the following issues:

- no more need to import manually one by one or use third party tool like MC-909SampleEditor ! just copy all prepared samples to the SmartMedia card or the MC-909 internal storage, bulk process all your samples in one go !
- no more need to set loop tempo manually on the MC-909 ! use ACID metadata from WAV files
- no more need to set loop points manually on the MC-909 ! use sustain loop points from WAV files
- no more need to set sample root key manually on the MC-909 ! use filename

## Requirements

- Node v20 or above
- TS-NODE to run the scripts as they are written in TypeScript
- VSCode (recommended)

## Installation

- npm i or pnpm i to install the dependencies

## Features

### For samples loops

Support ACID chunk in wav files:

- Set ACID beatmapped tempo
- Set ACIDidized loop length in beats
- Set sample tempo based on previous ACID metadata, no more need to set loop tempo manually on the MC-909 !
  NB: ACID chunk metadata can be edited manually with audio editor like SoundForge

### For samples oneshots

- support standard WAV sustain loop points and convert them to Roland MC-909 loop points, no more need to set loop points manually on the MC-909 !
- set sample root key based on filename, no more need to set sample root key manually on the MC-909 !

## Sample preparation

- Although the wavefile package support resampling and bitdepth reduction, they are not implemented in the scripts yet, samples for MC-909 must be 44.1Khz 16bits stereo or mono, so you must prepare your samples before using the scripts with a batch processing tool like SoundForge or EZ CD Audio Convert to prepare the samples to the 44.1Khz samplerate and 16 bit depth.
- for oneshots samples, root key can be provided directly in the filename like this : BA MySample Cm.wav or BA MySample C.wav, the root key is extracted from the filename and set in the MC-909 sample metadata, supported root keys are : C, Cm, C#, C#m, D, Dm, D#, D#m, E, Em, F, Fm, F#, F#m, G, Gm, G#, G#m, A, Am, A#, A#m, B, Bm with C being a C3 (midi note 60), C# being a C#3 (midi note 61) and so one until B being a B3 (midi note 71)

## Scripts usage

- All scripts are located in ./scripts directory
- Before running any scripts, edit SAMPLE_ROOT_DIR to the location of your samples that must be imported to the MC-909, the scripts will process all the samples in the directory and subdirectories and rename the samples to smplxxxx.wav format, where xxxx is the sample number of MC-909, the folders and subfolders are processed by alphabetical order.
- The script can be run directly from the VSCode run icon or with the following command : or `ts-node ./scripts/scriptname.ts` or `node --no-warnings=ExperimentalWarning --loader ts-node/esm ./scripts/scriptname.ts`
- a script report is generated at the root of this package : ./report.log

## ACID Scripts

- set-acid-beatmapped-tempo: set ACID beatmapped tempo
- set-acid-loop-1beat: set ACIDized loop length in beats : 1 beat loop length
- set-acid-loop-4beat: set ACIDized loop length in beats : 4 beats loop length
- set-acid-loop-16beat: set ACIDized loop length in beats : 16 beats loop length
- set-acid-oneshot: set ACID oneshot metadata
- check-acid-loop-tempo : check ACID loop tempo for a targetted tempo

## MC-909 Scripts

- 1-gather-stereo2mono : detect mono samples using 2 channels, they should be converted 1 mono channel for file size reduction as 2 channels are identical
- 2-check-names : check if the samples are named correctly and respect the 16 characters limitation of the MC-909
- 3-check-samples : check if the samples are 44.1Khz 16bits stereo or mono, which is the sample format used by MC-909
- 4-count-sampleslots : count the number of sampleslots used by all the samples contained in the SAMPLE_ROOT_DIR
- 5-process-dir : mains script to process all the samples in the SAMPLE_ROOT_DIR and subdirectories and rename the samples to smplxxxx.wav format where xxxx is the sample number of MC-909 starting at SAMPLE_START_INDEX, the folders and subfolders are processed by alphabetical order.

## CHUNK Scripts

- dump-chunks: dump all chunks of a wav file to chunk.json format

## Misc

Library and scripts based on the following packages:

- wavefile https://www.npmjs.com/package/wavefile
- uttori-audio-wave https://github.com/uttori/uttori-audio-wave
- uttori-data-tools https://github.com/uttori/uttori-data-tools
