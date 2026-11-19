import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import mindColors from '../json/mindColors.json'

export function GlbViewer({
  src,
  fallback,
  alt,
  interactive = false,
  color = null,
}) {
  const containerRef = useRef(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const sources = Array.isArray(src) ? src : [src]
  const sourcesKey = sources.join('|')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    setLoadFailed(false)
    const stableSources = sourcesKey ? sourcesKey.split('|') : []

    // 場景：包含所有 GLB 模型與光源
    const scene = new THREE.Scene()

    // 攝影機：35 度視角、近裁面 0.1、遠裁面 100
    // 初始位置在 (0, 1.5, 5)，由後面的尺寸計算更新成合適距離
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.set(0, 1.5, 5)

    // 渲染器：抗鋸齒、透明背景、支援 Android/iPhone 高解析度螢幕
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // 色調映射：ACES 讓亮部與暗部更柔和；數值越高畫面越亮
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08

    // 陰影：開啟並使用柔邊 PCF 陰影
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.setAttribute('aria-label', alt)
    container.appendChild(renderer.domElement)

    // 半球光：上方顏色用於受光面，下方顏色會直接影響橘色陰影/暗部
    scene.add(new THREE.HemisphereLight(0xFFD136, 0xFF8000, 1.7))

    // 主光：控制主要亮面與陰影方向
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5)
    keyLight.position.set(-4, 7, 4)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    keyLight.shadow.camera.near = 0.1
    keyLight.shadow.camera.far = 180
    keyLight.shadow.camera.left = -12
    keyLight.shadow.camera.right = 12
    keyLight.shadow.camera.top = 12
    keyLight.shadow.camera.bottom = -12
    keyLight.shadow.bias = -0.00015
    keyLight.shadow.normalBias = 0.035
    keyLight.shadow.radius = 3
    scene.add(keyLight)

    // 輪廓光：補強模型背面邊緣，讓外型更有立體感
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.6)
    rimLight.position.set(-3, 2, -2)
    scene.add(rimLight)

    // 補光：補亮較暗區域；橘色可以用來控制暗部偏色
    const fillLight = new THREE.DirectionalLight(0xFF8000, 1.9)
    fillLight.position.set(8, -5, 8)
    scene.add(fillLight)

    let modelGroup
    let pairPivot
    let animationFrame
    let disposed = false
    let controls

    if (interactive) {
      // OrbitControls：讓彈窗模型可由滑鼠或手機手指旋轉
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.enablePan = false
      controls.enableZoom = false
      controls.minDistance = 1
      controls.maxDistance = 5
      controls.target.set(0, 0, 0)
      controls.update()
    }

    const resize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (!width || !height) return

      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const loader = new GLTFLoader()
    Promise.all(
      stableSources.map(
        (source) =>
          new Promise((resolve, reject) => {
            loader.load(source, (gltf) => resolve(gltf.scene), undefined, reject)
          }),
      ),
    )
      .then((models) => {
        if (disposed) return
        models.forEach((model, index) => {
          // GLB 子網格：設定投影與接受陰影
          model.traverse((object) => {
            if (!object.isMesh) return
            object.castShadow = true
            object.receiveShadow = true

            // 依 GLB 檔名名稱（例如 001.glb）查 JSON 顏色表
            const fileName = stableSources[index]
              ?.split(/[?#/]/)
              .filter(Boolean)
              .pop()
            const modelName = fileName?.replace(/\.[^/.]+$/, '')
            const mindColor = color ?? mindColors[modelName]

            // 未找到名稱或未傳 color 時，保留 GLB 原始材質與貼圖顏色
            if (mindColor) {
              const materials = Array.isArray(object.material)
                ? object.material
                : [object.material]
              materials.forEach((material) => {
                material.color.set(mindColor)
                material.needsUpdate = true
              })
            }
          })
        })
        modelGroup = new THREE.Group()
        const maxModelDimension = Math.max(
          ...models.map((model) => {
            const size = new THREE.Box3()
              .setFromObject(model)
              .getSize(new THREE.Vector3())
            return Math.max(size.x, size.y, size.z)
          }),
        )
        //轉方向
        if (models.length === 2) {
          pairPivot = new THREE.Group()
          pairPivot.position.set(0, 0, 0)
          modelGroup.add(pairPivot)
        }

        const rowWidths = []
        let remainingModels = models.length
        let rowNumber = 0

        while (remainingModels > 0) {
          const modelsInRow = rowNumber % 2 === 0 ? 3 : 2
          const rowWidth = Math.min(modelsInRow, remainingModels)
          rowWidths.push(rowWidth)
          remainingModels -= rowWidth
          rowNumber += 1
        }

        models.forEach((model, index) => {
          let rowIndex = 0
          let columnIndex = index

          while (columnIndex >= rowWidths[rowIndex]) {
            columnIndex -= rowWidths[rowIndex]
            rowIndex += 1
          }

          const nominalModelsInRow = rowIndex % 2 === 0 ? 3 : 2
          const isOnlyTwoModels = models.length === 2
          const isOnlyOneModel = models.length === 1
          const rowOffset =
            (rowIndex - (rowWidths.length - 1) / 2) *
            maxModelDimension *
            0.65
          const isTwoModelRow =
            nominalModelsInRow === 2 && !isOnlyTwoModels
          const zOffset = isTwoModelRow && !isOnlyTwoModels
            ? (columnIndex === 0 ? -1 : 1) *
              maxModelDimension *
              0.65
            : (columnIndex - (nominalModelsInRow - 1) / 2) *
              maxModelDimension *
              0.65

          const zRotation = isOnlyOneModel
            ? 0
            : isOnlyTwoModels
            ? THREE.MathUtils.degToRad(columnIndex === 0 ? 45 : -45)
            : isTwoModelRow
            ? 0
            : THREE.MathUtils.degToRad(columnIndex * 90)
          const yRotation = isTwoModelRow && !isOnlyTwoModels
            ? THREE.MathUtils.degToRad(90)
            : 0

          model.position.y = isOnlyOneModel ? 0 : -rowOffset
          model.position.z = isOnlyOneModel ? 0 : zOffset
          model.rotation.z = zRotation
          model.rotation.y = yRotation
          if (pairPivot) {
            pairPivot.add(model)
          } else {
            modelGroup.add(model)
          }
        })

        if (pairPivot) {
          pairPivot.updateMatrixWorld(true)
          const pairBox = new THREE.Box3().setFromObject(pairPivot)
          const pairCenter = pairBox.getCenter(new THREE.Vector3())

          pairPivot.position.copy(pairCenter)
          pairPivot.children.forEach((model) => {
            model.position.sub(pairCenter)
          })
        }

        scene.add(modelGroup)

        const box = new THREE.Box3().setFromObject(modelGroup)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const horizontalFov = 2 * Math.atan(
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
            camera.aspect,
        )
        const fittingFov = Math.min(
          THREE.MathUtils.degToRad(camera.fov),
          horizontalFov,
        )
        const boxRadius = size.length() / 2
        const fitDistance = (boxRadius / Math.sin(fittingFov / 2)) * 1.18
        
        modelGroup.position.sub(center)
        camera.position.set(-fitDistance, fitDistance * 0.08, fitDistance)
        if (controls) {
          controls.minDistance = fitDistance * 0.65
          controls.maxDistance = fitDistance * 3
          controls.target.set(0, 0, 0)
          controls.update()
        }
        camera.lookAt(0, 0, 0)
        resize()
      })
      .catch(() => {
        if (!disposed) setLoadFailed(true)
      })

    const animate = () => {
      if (!interactive) {
        if (pairPivot) {
          pairPivot.rotation.y += 0.006
          pairPivot.rotation.z = 75
        } else if (modelGroup) {
          modelGroup.rotation.y += 0.006
          modelGroup.rotation.z = 75
        }
      }
      controls?.update()
      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      controls?.dispose()
      resizeObserver.disconnect()
      renderer.dispose()
      renderer.domElement.remove()
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
    }
  }, [sourcesKey, alt, interactive, color])

  if (loadFailed && fallback) {
    return fallback
  }

  return (
    <div
      ref={containerRef}
      className="mind-glb"
      role="img"
      aria-label={alt}
    />
  )
}
