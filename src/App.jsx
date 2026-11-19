import { useEffect, useRef, useState } from 'react'
import { createGeo } from './js/zdog'
import { loadSchedule, refreshInterval } from './js/sheet'
import { Image, Masonry } from 'antd'
import { GlbViewer } from './showminds/V_glbMind'
import './App.css'

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
        const nextMind = await loadSchedule()
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
    const intervalId = window.setInterval(
      loadMindSchedule,
      refreshInterval,
    )

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
        <div
          className={`mind-grid-container mind-grid-count-${mind.length}`}
        >
          <Masonry
            className="mind-grid"
            columns={{
              xs: 2,
              md: mind.length > 0 && mind.length < 4 ? mind.length : 4,
            }}
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
              interactive
            />
            <img className="mind-sale-badge" src="/boom.svg" alt="特價" />
            <p className="mind-sale-title">
              {selectedMind.timestamp.replace(' ', '\n')}
            </p>
            <p className="mind-sale-p">連想型號：{selectedMind.id}</p>
          </div>
        </div>
      )}
      <img className="sale-badge" src="/boom.svg" alt="特賣" />
      <h1 className="sale-title">PURE MIND</h1>
    </>
  )
}

export default App
