export const sheetEndpoint =
  'https://docs.google.com/spreadsheets/d/1sLH2t3FvVv4yfe0NkfghnEx8hjO4eENjVbOFb5nborE/export?format=csv&gid=0'

export const refreshInterval = 3_000

function timestampToMilliseconds(value) {
  const match = value.match(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (!match) return null

  const [, year, month, day, hours, minutes, seconds = '0'] = match
  const values = [year, month, day, hours, minutes, seconds].map(Number)
  const [yearNumber, monthNumber, dayNumber, hoursNumber, minutesNumber, secondsNumber] =
    values

  if (
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > 31 ||
    hoursNumber > 23 ||
    minutesNumber > 59 ||
    secondsNumber > 59
  ) {
    return null
  }

  const timestamp = Date.UTC(
    yearNumber,
    monthNumber - 1,
    dayNumber,
    hoursNumber,
    minutesNumber,
    secondsNumber,
  )
  const date = new Date(timestamp)
  if (
    date.getUTCFullYear() !== yearNumber ||
    date.getUTCMonth() !== monthNumber - 1 ||
    date.getUTCDate() !== dayNumber
  ) {
    return null
  }

  return timestamp
}

function parseCsvRow(row) {
  const cells = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index]
    const nextCharacter = row[index + 1]

    if (character === '"' && quoted && nextCharacter === '"') {
      cell += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += character
    }
  }

  cells.push(cell.trim())
  return cells
}

export function parseSchedule(responseText) {
  const rows = responseText.trim().split(/\r?\n/)
  return rows.flatMap((row) => {
    const [timestamp, rawIds = ''] = parseCsvRow(row)
    const timestampInMilliseconds = timestampToMilliseconds(timestamp)
    if (timestampInMilliseconds == null) return []

    const ids = rawIds
      .replace(/^"+|"+$/g, '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (ids.length === 0) return []

    const normalizedIds = ids.map((id) =>
      /^\d+$/.test(id) ? id.padStart(3, '0') : id,
    )

    return {
      id: normalizedIds.join('-'),
      models: normalizedIds.map(
        (id) => `${import.meta.env.BASE_URL}model/${id}.glb`,
      ),
      timestamp,
      time: timestampInMilliseconds,
    }
  })
}

export async function loadSchedule() {
  const response = await fetch(sheetEndpoint)
  if (!response.ok) {
    throw new Error(`Google Sheet request failed: ${response.status}`)
  }

  return parseSchedule(await response.text())
}
