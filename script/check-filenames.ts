import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'H://__MC-909_SM/Trance'

let out = ''

function writeFileSync(data: string, filename = 'output.log') {
  fs.writeFileSync(path.join(process.cwd(), filename), data)
}

function appendFileSync(text: string, filename = 'output.log') {
  fs.appendFileSync(path.join(process.cwd(), filename), `${text}\r\n`, 'utf8')
}

/**
 * Recursively lists all files in a directory and its subdirectories.
 * @param {string} dir - The root directory to start listing files from.
 * @param {Array<string>} fileList - An array to hold the list of files.
 * @returns {Array<string>} - The list of all files.
 */
function listFilesRecursiveSync(dir: string, fileList: string[] = []) {
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

async function run() {
  // async function processItem(item: (typeof items)[0]) {}

  const files = listFilesRecursiveSync(ROOT)

  for (const file of files) {
    const filename = path.basename(file)
    const name = path.parse(file).name
    if (name.length > 16) {
      out = out + file + '\r\n'
      console.info(file)
    }
  }

  writeFileSync(out)
}

await run()
