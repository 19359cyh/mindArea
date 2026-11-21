import { useMemo, useState } from 'react'
import { Image, Masonry } from 'antd'
import { getGlbSnapshot, GlbViewer } from './V_glbMind'

export function ArchivePage({ minds, resolveModels, resolveAsset, onSelect, onClose }) {
  const snapshotSources = useMemo(
    () => {
      const uniqueSources = new Map()
      minds
        .map((item) => resolveModels(item))
        .filter((sources) => sources?.length)
        .forEach((sources) => {
          const key = sources.join('|')
          uniqueSources.set(key, sources)
        })
      return [...uniqueSources.values()]
    },
    [minds, resolveModels],
  )
  const [snapshotIndex, setSnapshotIndex] = useState(0)
  const snapshotSource = snapshotSources[snapshotIndex]

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
          {snapshotSource && (
            <div
              className="mind-archive-snapshot-generator"
              aria-hidden="true"
            >
              <GlbViewer
                key={snapshotSource.join('|')}
                src={snapshotSource}
                alt=""
                animated={false}
                snapshot
                onSnapshot={() =>
                  setSnapshotIndex((index) => index + 1)
                }
              />
            </div>
          )}
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
                    getGlbSnapshot(resolveModels(data)) ? (
                      <img
                        className="mind-glb-snapshot"
                        src={getGlbSnapshot(resolveModels(data))}
                        alt={`Mind ${data.id}`}
                      />
                    ) : (
                      <div className="mind-glb-snapshot-placeholder" aria-label={`Mind ${data.id}`} />
                    )
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
