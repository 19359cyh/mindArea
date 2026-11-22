import { useEffect, useRef, useState } from 'react'
import { loadSchedule, refreshInterval } from '../js/sheet'
import { GlbViewer } from './V_glbMind'

export function Signtv() {
  const [updatedMind, setUpdatedMind] = useState(null)
  const [animation, setAnimation] = useState('')
  const latestSchedule = useRef('')
  const exitTimer = useRef(null)

  useEffect(() => {
    let active = true

    // 偵測 Mind 資料更新
    const checkUpdate = async () => {
      try {
        const minds = await loadSchedule()
        if (!active) return
        const schedule = JSON.stringify(minds)

        if (latestSchedule.current && schedule !== latestSchedule.current) {
          latestSchedule.current = schedule
          const latestMind = [...minds].sort((a, b) => b.time - a.time)[0]

          // 顯示最新更新的Mind && 彈入動畫
          setUpdatedMind(latestMind ?? null)
          setAnimation('bounceInDown')

          // 顯示 x 秒後退出
          window.clearTimeout(exitTimer.current)
          exitTimer.current = window.setTimeout(() => {
            setAnimation('zoomOutLeft')
          }, 10_000)
        } else if (!latestSchedule.current) {

          latestSchedule.current = schedule
        }
      } catch (error) {
        if (active) {
          console.error('Unable to update mind schedule from Google Sheet.', error)
        }
      }
    }

    checkUpdate()
    const intervalId = window.setInterval(checkUpdate, refreshInterval)

    return () => {
      active = false
      window.clearInterval(intervalId)
      // 退出計時器
      window.clearTimeout(exitTimer.current)
    }
  }, [])

  if (!updatedMind) return null

  // 切換動畫狀態
  const nextAnimation = (event) => {
    if (event.target !== event.currentTarget) return

    if (animation === 'bounceInDown') {
      setAnimation('')
    } else if (animation === 'zoomOutLeft') {
      setUpdatedMind(null)
      setAnimation('')
    }
  }

  return (
    <main
      key={updatedMind.id}
      className={animation ? `animate__animated animate__${animation}` : ''}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
      }}
      aria-label="Mind 更新顯示"
      onAnimationEnd={nextAnimation}
    >
      <div style={{ width: '80vmin', height: '80vmin' }}>
        <GlbViewer
          src={updatedMind.models}
          alt={`Mind ${updatedMind.id}`}
        />
      </div>
    </main>
  )
}
