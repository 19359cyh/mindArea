import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import mindColors from '../json/mindColors.json'

const modelCache = new Map()
const cachedGeometries = new WeakSet()
const cachedMaterials = new WeakSet()
const coloredMaterialCache = new WeakMap()
const snapshotCache = new Map()

export function getGlbSnapshot(src, color = null) {
  const sourcesKey = (Array.isArray(src) ? src : [src]).join('|')
  return snapshotCache.get(`${sourcesKey}|${color ?? ''}`) ?? null
}

export function setGlbSnapshot(src, url, color = null) {
  const sourcesKey = (Array.isArray(src) ? src : [src]).join('|')
  snapshotCache.set(`${sourcesKey}|${color ?? ''}`, url)
}

export function loadCachedModel(source) {
  if (modelCache.has(source)) return modelCache.get(source)

  const promise = new Promise((resolve, reject) => {
    new GLTFLoader().load(
      source,
      (gltf) => {
        gltf.scene.traverse((object) => {
          if (!object.isMesh) return

          cachedGeometries.add(object.geometry)
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          materials.forEach((material) => cachedMaterials.add(material))
        })
        resolve(gltf.scene)
      },
      undefined,
      reject,
    )
  })

  modelCache.set(source, promise)
  promise.catch(() => modelCache.delete(source))
  return promise
}

export function getColoredMaterial(material, color) {
  let materialsByColor = coloredMaterialCache.get(material)
  if (!materialsByColor) {
    materialsByColor = new Map()
    coloredMaterialCache.set(material, materialsByColor)
  }

  if (materialsByColor.has(color)) {
    return materialsByColor.get(color)
  }

  const coloredMaterial = material.clone()
  coloredMaterial.color.set(color)
  coloredMaterial.needsUpdate = true
  cachedMaterials.add(coloredMaterial)
  materialsByColor.set(color, coloredMaterial)
  return coloredMaterial
}

export function isCachedGeometry(geometry) {
  return cachedGeometries.has(geometry)
}

export function isCachedMaterial(material) {
  return cachedMaterials.has(material)
}

Object.keys(mindColors).forEach((modelName) => {
  loadCachedModel(`${import.meta.env.BASE_URL}model/${modelName}.glb`)
})
