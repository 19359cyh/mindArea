import { useEffect, useRef, useState } from 'react'
import { createGeo } from './js/zdog'
import { loadSchedule, refreshInterval } from './js/sheet'
import { Image, Masonry } from 'antd'
import { GlbViewer } from './showminds/V_glbMind'
import { ArchivePage } from './showminds/ArchivePage'
import 'animate.css';
import './App.css'

function App() {
  const svgRef = useRef(null)
  const [selectedMind, setSelectedMind] = useState(null)
  const [archiveOpen, setArchiveOpen] = useState(
    () => window.location.hash === '#archive',
  )
  const [mind, setMind] = useState([])
  const [latestMindAnimation, setLatestMindAnimation] = useState(null)
  const previousLatestMindId = useRef(null)
  const sortedMinds = [...mind].sort((a, b) => b.time - a.time)
  const mainMinds = sortedMinds.slice(0, 13) //首頁顯示
  const archivedMinds = sortedMinds.slice(13) //超過數量圖鑑顯示
  const remainingMainMinds = mainMinds.slice(1)
  const latestMindId = mainMinds[0]?.id

  useEffect(() => {
    if (!latestMindId) return

    if (
      previousLatestMindId.current &&
      previousLatestMindId.current !== latestMindId
    ) {
      setLatestMindAnimation('lightSpeedInLeft')
    }
    previousLatestMindId.current = latestMindId
  }, [latestMindId])

  // 第一個大圖動畫
  const nextLatestAnimation = () => {
    if (latestMindAnimation === 'lightSpeedInLeft') {
      setLatestMindAnimation('rubberBand')
    } else if (latestMindAnimation === 'rubberBand') {
      setLatestMindAnimation(null)
    }
  }

  const resolveAsset = (asset) => asset
  const resolveModels = (item) => {
    if (item.models) return item.models
    if (item.model) return [item.model]
    if (!item.img) return null

    const path = String(item.img).split(/[?#]/)[0]
    const fileName = path.substring(path.lastIndexOf('/') + 1)
    const stem = fileName.replace(/\.[^/.]+$/, '')
    return stem ? [`${import.meta.env.BASE_URL}model/${stem}.glb`] : null
  }

  useEffect(() => {
    if (archiveOpen) return
    return createGeo(svgRef.current)
  }, [archiveOpen])

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

  useEffect(() => {
    const syncArchiveRoute = () => {
      setArchiveOpen(window.location.hash === '#archive')
      setSelectedMind(null)
    }

    window.addEventListener('hashchange', syncArchiveRoute)
    return () => window.removeEventListener('hashchange', syncArchiveRoute)
  }, [])

  const openArchive = () => {
    window.location.hash = 'archive'
  }

  const closeArchive = () => {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`)
    setArchiveOpen(false)
  }

  return (
    <>
      {!archiveOpen && (
        <>
          <svg
            className="zdog-canvas"
            ref={svgRef}
            width="320"
            height="320"
            aria-label="Rotating text"
          />
          <section id="mind" className="mind">
            <div
              className={`mind-grid-container mind-grid-count-${mainMinds.length}`}
            >
              {/* 第一個大圖 */}
              {mainMinds[0] && (
                <div className="mind-main-feature">
                  <div
                    className={`mind-main-feature-item ${latestMindAnimation ? `animate__animated animate__${latestMindAnimation}` : ''}`}
                    onAnimationEnd={nextLatestAnimation}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedMind(mainMinds[0])}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedMind(mainMinds[0])
                      }
                    }}
                  >
                    <div className="mind-main-feature-content">
                      {resolveModels(mainMinds[0]) ? (
                        <GlbViewer
                          key={resolveModels(mainMinds[0]).join('|')}
                          src={resolveModels(mainMinds[0])}
                          alt={`Mind ${mainMinds[0].id}`}
                        />
                      ) : (
                        <Image
                          className={`mind-img ${mainMinds[0].link ? 'has-link' : ''}`}
                          src={resolveAsset(mainMinds[0].img)}
                          alt={`Mind ${mainMinds[0].id}`}
                          preview={false}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* 其他圖 */}
              <Masonry
                className="mind-grid mind-main-masonry"
                columns={{
                  xs: 2,
                  md: remainingMainMinds.length > 0 && remainingMainMinds.length < 4 ? remainingMainMinds.length : 4,
                }}
                gutter={[12, 12]}
                items={remainingMainMinds.map((item, index) => ({
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
        </>
      )}
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
            <img
              className="mind-sale-badge"
              src={`${import.meta.env.BASE_URL}boom.svg`}
              alt="特價"
            />
            <p className="mind-sale-title">
              {selectedMind.timestamp.replace(' ', '\n')}
            </p>
            <p className="mind-sale-p">連想型號：{selectedMind.id}</p>
          </div>
        </div>
      )}
      {archiveOpen && (
        <ArchivePage
          minds={archivedMinds}
          resolveModels={resolveModels}
          resolveAsset={resolveAsset}
          onSelect={setSelectedMind}
          onClose={closeArchive}
        />
      )}
      {!archiveOpen && (
        <>
          {archivedMinds.length > 0 && (
            <button
              className="mind-archive-close"
              type="button"
              aria-label="開啟 Mind 圖鑑"
              onClick={openArchive}
            >
              <img
                className="mind-archive-close-badge"
                src={`${import.meta.env.BASE_URL}boom.svg`}
                alt=""
              />
              <span className="mind-archive-close-title">PURE MIND</span>
            </button>
          )}
        </>
      )}
    </>
  )
}

export default App
