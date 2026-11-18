import { useEffect, useRef, useState } from 'react'
import { createGeo } from './js/zdog'
import { Image, Masonry } from 'antd'
import { GlbViewer } from './showminds/V_glbMind'
import './App.css'

const sheetEndpoint =
  'https://docs.google.com/spreadsheets/d/1KkNvrQ6iSb0tmuZZQN0pFvi26NUBf_odpsDTvajLdqA/export?format=csv&gid=0'
const refreshInterval = 3_000

function toMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number)
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }
  return hours * 60 + minutes
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

function parseSchedule(responseText) {
  const rows = responseText.trim().split(/\r?\n/).slice(1)
  return rows.flatMap((row) => {
    const [time, rawIds = ''] = parseCsvRow(row)
    const timeInMinutes = toMinutes(time)
    if (timeInMinutes == null) return []

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
      models: normalizedIds.map((id) => `/model/${id}.glb`),
      time: timeInMinutes,
    }
  })
}

function App() {
  const svgRef = useRef(null)
  const [selectedMind, setSelectedMind] = useState(null)
  const [mind, setMind] = useState([])

  const resolveAsset = (asset) => asset
  const resolveModels = (item) => {
    if (item.models) return item.models
    if (item.model) return [item.model]
    if (!item.img) return null

    const path = String(item.img).split(/[?#]/)[0]
    const fileName = path.substring(path.lastIndexOf('/') + 1)
    const stem = fileName.replace(/\.[^/.]+$/, '')
    return stem ? [`/model/${stem}.glb`] : null
  }

  useEffect(() => {
    return createGeo(svgRef.current)
  }, [])

  useEffect(() => {
    let active = true

    const loadMindSchedule = async () => {
      try {
        const response = await fetch(sheetEndpoint)
        if (!response.ok) {
          throw new Error(`Google Sheet request failed: ${response.status}`)
        }

        const nextMind = parseSchedule(await response.text())
        if (!active) return

        setMind(nextMind)
        setSelectedMind((currentMind) =>
          currentMind && nextMind.some((item) => item.id === currentMind.id)
            ? currentMind
            : null,
        )
      } catch (error) {
        if (active) {
          console.error('Unable to load mind schedule from Google Sheet.', error)
        }
      }
    }

    loadMindSchedule()
    const intervalId = window.setInterval(loadMindSchedule, refreshInterval)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <>
      <svg
        className="zdog-canvas"
        ref={svgRef}
        width="320"
        height="320"
        aria-label="Rotating text"
      />
      <section id="mind">
        <div className="mind-grid-container">
          <Masonry
            className="mind-grid"
            columns={{ xs: 2, md: 4 }}
            gutter={[12, 12]}
            items={[...mind]
              .sort((a, b) => b.time - a.time)
              .map((item, index) => ({
                key: `${item.id}-${index}`,
                data: item,
              }))}
            itemRender={({ data }) => (
              <div
                className="mind-item"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMind(data)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedMind(data)
                  }
                }}
              >
                <div className="mind-item-inner">
                  {resolveModels(data) ? (
                    <GlbViewer
                      key={resolveModels(data).join('|')}
                      src={resolveModels(data)}
                      alt={`Mind ${data.id}`}
                      fallback={
                        <Image
                          className={`mind-img ${data.link ? 'has-link' : ''}`}
                          src={resolveAsset(data.img)}
                          alt={`Mind ${data.id}`}
                          preview={false}
                        />
                      }
                    />
                  ) : (
                    <Image
                      className={`mind-img ${data.link ? 'has-link' : ''}`}
                      src={resolveAsset(data.img)}
                      alt={`Mind ${data.id}`}
                      preview={false}
                    />
                  )}
                </div>
              </div>
            )}
          />
        </div>
      </section>
      {selectedMind && (
        <div
          className="mind-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`放大檢視 mind ${selectedMind.id}`}
          onClick={() => setSelectedMind(null)}
        >
          <div
            className="mind-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="mind-lightbox-close"
              type="button"
              aria-label="關閉檢視"
              onClick={() => setSelectedMind(null)}
            >
              ×
            </button>
            <GlbViewer
              src={resolveModels(selectedMind)}
              alt={`Mind ${selectedMind.id}`}
            />
          </div>
        </div>
      )}
      <img className="sale-badge" src="/boom.svg" alt="特賣" />
      <h1 className="seal-title">PURE MIND</h1>
    </>
  )
}

export default App
