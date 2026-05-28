import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

const app = express()

app.use(cors())
app.use(express.json())

// Since you're running the server from /server
// process.cwd() should be:
// C:/Users/arios/code/js-sampler/server

const ROOT = process.cwd()

const LIBRARY_PATH = path.join(
  ROOT,
  '../client/src/library'
)


const BANKS_PATH = path.join(
  ROOT,
  'samples'
)
// expose audio samples to frontend
app.use(
  '/samples/library',
  express.static(LIBRARY_PATH)
)

// get all folders/files in library
app.get('/api/library', (req, res) => {
  try {
    console.log('Reading library from:', LIBRARY_PATH)

    const folders = fs.readdirSync(LIBRARY_PATH)

    const result: Record<string, string[]> = {}

    for (const folder of folders) {
      const folderPath = path.join(
        LIBRARY_PATH,
        folder
      )

      // skip files
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

// load bank json
app.get('/api/banks/:bank', (req, res) => {
  try {
    const bank = req.params.bank

    const file = path.join(
      BANKS_PATH,
      `bank${bank}.json`
    )

    const data = fs.readFileSync(
      file,
      'utf-8'
    )

    res.json(JSON.parse(data))
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: 'Failed to load bank'
    })
  }
})

// save bank json
app.post('/api/banks/:bank', (req, res) => {
  try {
    const bank = req.params.bank

    const file = path.join(
      BANKS_PATH,
      `bank${bank}.json`
    )

    fs.writeFileSync(
      file,
      JSON.stringify(req.body, null, 2)
    )

    res.json({ ok: true })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: 'Failed to save bank'
    })
  }
})

app.listen(3001, () => {
  console.log('SERVER RUNNING ON 3001')
  console.log('Library:', LIBRARY_PATH)
  console.log('Banks:', BANKS_PATH)
})