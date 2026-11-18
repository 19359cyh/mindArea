import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export function GlbViewer({ src, fallback, alt }) {
  const containerRef = useRef(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const sources = Array.isArray(src) ? src : [src]
  const sourcesKey = sources.join('|')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    setLoadFailed(false)
    const stableSources = sourcesKey ? sourcesKey.split('|') : []

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    camera.position.set(0, 1.5, 5)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.domElement.setAttribute('aria-label', alt)
    container.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9baa, 2))

    const keyLight = new THREE.DirectionalLight(0xffffff, 3)
    keyLight.position.set(3, 5, 4)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x91d7ff, 2)
    rimLight.position.set(-4, 2, -3)
    scene.add(rimLight)

    let modelGroup
    let animationFrame
    let disposed = false

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
        modelGroup = new THREE.Group()
        const maxModelDimension = Math.max(
          ...models.map((model) => {
            const size = new THREE.Box3()
              .setFromObject(model)
              .getSize(new THREE.Vector3())
            return Math.max(size.x, size.y, size.z)
          }),
        )

        models.forEach((model, index) => {
          const zRotation =
            models.length === 1
              ? 0
              : (index / (models.length - 1) * 2 - 1) *
                THREE.MathUtils.degToRad(15)

          model.position.z =
            (index - (models.length - 1) / 2) * maxModelDimension * 0.65
          model.rotation.z = zRotation
          modelGroup.add(model)
        })

        scene.add(modelGroup)

        const box = new THREE.Box3().setFromObject(modelGroup)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDimension = Math.max(size.x, size.y, size.z)

        modelGroup.position.sub(center)
        camera.position.set(0, maxDimension * 0.15, maxDimension * 2.5)
        camera.lookAt(0, 0, 0)
        resize()
      })
      .catch(() => {
        if (!disposed) setLoadFailed(true)
      })

    const animate = () => {
      if (modelGroup) {
        modelGroup.rotation.y += 0.006
      }
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
  }, [sourcesKey, alt])

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
