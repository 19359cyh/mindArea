import { useEffect, useRef, useState } from 'react'
import { Image, Masonry } from 'antd'
import { GlbViewer } from './V_glbMind'

function ArchiveGlbViewer({ src, alt }) {
  const viewerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = viewerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={viewerRef} className="mind-glb">
      {isVisible && (
        <GlbViewer
          src={src}
          alt={alt}
          animated={false}
        />
      )}
    </div>
  )
}

export function ArchivePage({ minds, resolveModels, resolveAsset, onSelect, onClose }) {
  return (
    <div
      className="mind-archive"
      role="dialog"
      aria-modal="true"
      aria-label="Mind 圖鑑"
      onClick={onClose}
    >
      <div
        className="mind-archive-content"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="mind-archive-close"
          type="button"
          aria-label="關閉圖鑑"
          onClick={onClose}
        >
          <img
            className="mind-archive-close-badge"
            src={`${import.meta.env.BASE_URL}boom.svg`}
            alt=""
          />
          <span className="mind-archive-close-title">BACK MART</span>
        </button>
        <Masonry
          className="mind-archive-grid"
          columns={{
            xs: 2,
            md: minds.length > 0 && minds.length < 4 ? minds.length : 4,
          }}
          gutter={[12, 12]}
          items={minds.map((item, index) => ({
            key: `archive-${item.id}-${index}`,
            data: item,
          }))}
          itemRender={({ data }) => (
            <button
              className="mind-archive-item"
              type="button"
              aria-label={`開啟 Mind ${data.id}`}
              onClick={() => onSelect(data)}
            >
              <div className="mind-archive-item-inner">
                {resolveModels(data) ? (
                  <ArchiveGlbViewer
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
            </button>
          )}
        />
      </div>
    </div>
  )
}
