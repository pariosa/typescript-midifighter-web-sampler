import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()

app.get('/api/library', async (req, res) => {
  try {
    const libraryPath = path.join(
      __dirname,
      '../../client/src/library'
    )

    const folders = fs.readdirSync(libraryPath)

    const result: Record<string, string[]> = {}

    for (const folder of folders) {
      const folderPath = path.join(libraryPath, folder)

      // skip non-directories
      if (!fs.statSync(folderPath).isDirectory()) {
        continue
      }

      const files = fs.readdirSync(folderPath)

      result[folder] = files
    }

    res.json(result)
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: 'Failed to read library'
    })
  }
})