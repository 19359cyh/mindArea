import Zdog from 'zdog'
import { createTextLayers } from './text'

export function createGeo(svg) {
  const zoom = 4
  const sceneWidth = 40
  const sceneHeight = 16
  const viewWidth = sceneWidth * zoom
  const viewHeight = sceneHeight * zoom

  svg.setAttribute(
    'viewBox',
    `${-viewWidth / 2} ${-viewHeight / 2} ${viewWidth} ${viewHeight}`,
  )

  const scene = new Zdog.Anchor()
  const textGroup = createTextLayers(scene)

  const viewRotation = new Zdog.Vector()
  let elapsed = 0
  let previousTime = performance.now()
  const holdDuration = 3000
  const transitionDuration = 1000
  const segmentDuration = holdDuration + transitionDuration
  const faces = [
    { x: 0, y: 0 },
    { x: 0, y: -Zdog.TAU / 4 },
    { x: -Zdog.TAU / 4, y: -Zdog.TAU / 4 },
  ]
  let animationFrame

  function animate() {
    update()
    render()
    animationFrame = requestAnimationFrame(animate)
  }

  function update() {
    const now = performance.now()

    elapsed += now - previousTime
    const faceIndex = Math.floor(elapsed / segmentDuration) % faces.length
    const localTime = elapsed % segmentDuration
    const nextFaceIndex = (faceIndex + 1) % faces.length
    const currentFace = faces[faceIndex]
    const nextFace = faces[nextFaceIndex]

    if (localTime < holdDuration) {
      viewRotation.x = currentFace.x
      viewRotation.y = currentFace.y
    } else {
      const progress = (localTime - holdDuration) / transitionDuration
      const easedProgress = Zdog.easeInOut(progress, 4)

      viewRotation.x = Zdog.lerp(currentFace.x, nextFace.x, easedProgress)
      viewRotation.y = Zdog.lerp(currentFace.y, nextFace.y, easedProgress)
    }

    previousTime = now
    textGroup.rotate.set(viewRotation)
    textGroup.normalizeRotate()
    scene.updateGraph()
  }

  function render() {
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild)
    }
    scene.renderGraphSvg(svg)
  }

  animate()

  return () => cancelAnimationFrame(animationFrame)
}
