import fs from 'node:fs'
import path from 'node:path'
import { log } from './report.js'

/**
 * Recursively lists all files in a directory and its subdirectories.
 * @param {string} dir - The root directory to start listing files from.
 * @param {Array<string>} fileList - An array to hold the list of files.
 * @returns {Array<string>} - The list of all files.
 */
export function listFilesRecursiveSync(dir: string, fileList: string[] = []) {
  // Read the contents of the directory
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    // Construct the full path of the file or directory
    const filePath = path.join(dir, file)
    // Get stats about the file or directory
    const stats = fs.statSync(filePath)
    // Check if the path is a directory
    if (stats.isDirectory()) {
      // If it's a directory, recursively list its contents
      listFilesRecursiveSync(filePath, fileList)
    } else {
      // If it's a file, add it to the file list
      fileList.push(filePath)
    }
  })
  return fileList
}

export function listWavFilesRecursiveSync(dir: string, fileList: string[] = []) {
  const files = listFilesRecursiveSync(dir)
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase()
    return ext === '.wav'
  })
}

export function checkFilesExtension(dir: string) {
  log(`Processing ${dir} ...`)
  log('Checking file extensions ...')
  const files = listFilesRecursiveSync(dir)
  for (const file of files) {
    const ext = path.extname(file)
    if (ext !== '.wav') {
      log(`ERROR with ${file}\r\nExtension must be .wav`)
    }
  }
}
