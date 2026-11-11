import Zdog from 'zdog'

// 模型
export function extrudeShape(addTo, frontPath, depth, colors) {
  // 背面沿 z 軸反方向移動，讓 frontPath 位於模型前方
  const backPath = frontPath.map((point) => ({ ...point, z: point.z - depth }))
  const frontColor = colors.front ?? colors[0]
  const backColor = colors.back ?? colors[1] ?? frontColor
  const sideColor = colors.side ?? backColor

  // 建立正面與背面
  new Zdog.Shape({
    addTo,
    path: frontPath,
    closed: true,
    stroke: false,
    fill: true,
    color: frontColor,
  })

  new Zdog.Shape({
    addTo,
    path: backPath,
    closed: true,
    stroke: false,
    fill: true,
    color: backColor,
  })

  // 模型側面
  for (let i = 0; i < frontPath.length; i += 1) {
    const next = (i + 1) % frontPath.length

    new Zdog.Shape({
      addTo,
      path: [
        frontPath[i], frontPath[next],
        backPath[next], backPath[i],
      ],
      closed: true,
      stroke: false,
      fill: true,
      color: sideColor,
    })
  }
}

// 圓
// 將圓環切成多個扇形，空隙是挖空
function createCircleSegments(addTo, colors) {
  const radius = 7
  const innerRadius = 5.1
  const cutCount = 8
  const gap = 0.14
  const depth = 1.8
  const arcSteps = 8

  for (let index = 0; index < cutCount; index += 1) {
    // 每個扇形都保留一小段 gap
    const center = (Zdog.TAU / cutCount) * index
    const start = center + gap / 2
    const end = center + Zdog.TAU / cutCount - gap / 2
    const frontPath = []

    // 建立扇形外弧
    for (let step = 0; step <= arcSteps; step += 1) {
      const angle = start + ((end - start) * step) / arcSteps
      frontPath.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: depth / 2,
      })
    }

    // 反向建立內弧，讓輪廓回到起點並形成中空區域
    for (let step = arcSteps; step >= 0; step -= 1) {
      const angle = start + ((end - start) * step) / arcSteps
      frontPath.push({
        x: Math.cos(angle) * innerRadius,
        y: Math.sin(angle) * innerRadius,
        z: depth / 2,
      })
    }

    extrudeShape(addTo, frontPath, depth, colors)
  }
}

// 方形
function createSquareSegments(addTo, colors) {
  const outer = 7
  const inner = 5.1
  const gap = 0.7
  const depth = 1.8
  const z = depth / 2
  const segments = [
    [
      { x: -inner + gap, y: -inner, z },
      { x: inner - gap, y: -inner, z },
      { x: outer - gap, y: -outer, z },
      { x: -outer + gap, y: -outer, z },
    ],
    [
      { x: inner, y: -inner + gap, z },
      { x: inner, y: inner - gap, z },
      { x: outer, y: outer - gap, z },
      { x: outer, y: -outer + gap, z },
    ],
    [
      { x: inner - gap, y: inner, z },
      { x: -inner + gap, y: inner, z },
      { x: -outer + gap, y: outer, z },
      { x: outer - gap, y: outer, z },
    ],
    [
      { x: -inner, y: inner - gap, z },
      { x: -inner, y: -inner + gap, z },
      { x: -outer, y: -outer + gap, z },
      { x: -outer, y: outer - gap, z },
    ],
  ]

  segments.forEach((path) => extrudeShape(addTo, path, depth, colors))
}

// 切掉四個角的方形
function createChamferedCore(addTo, colors) {
  const size = 5.1
  const corner = 0.9
  const depth = 1.8
  const z = depth / 2
  const frontPath = [
    { x: -size + corner, y: -size, z },
    { x: size - corner, y: -size, z },
    { x: size, y: -size + corner, z },
    { x: size, y: size - corner, z },
    { x: size - corner, y: size, z },
    { x: -size + corner, y: size, z },
    { x: -size, y: size - corner, z },
    { x: -size, y: -size + corner, z },
  ]

  extrudeShape(addTo, frontPath, depth, colors)
}

// Mind1
export function Mind1(
  addTo,
  x = 0,
  y = 0,
  z = 0,
  colors = {
    front: '#50afd0',
    back: '#398ba8',
    side: '#398ba8',
  },
) {
  const mind1 = new Zdog.Anchor({
    addTo,
    translate: { x, y, z },
  })

  const centerRadius = 5.1
  const thickness = 1.8

  // 中央圓柱填補中心
  new Zdog.Cylinder({
    addTo: mind1,
    diameter: centerRadius * 2,
    length: thickness,
    stroke: false,
    color: colors.front,
    frontFace: colors.front,
    backface: colors.back,
  })

  createCircleSegments(mind1, colors)

  return mind1
}

export function Mind2(
  addTo,
  x = 0,
  y = 0,
  z = 0,
  colors = {
    front: '#d0b250',
    back: '#a87439',
    side: '#a87439',
  },
) {
  const mind2 = new Zdog.Anchor({
    addTo,
    translate: { x, y, z },
  })

  createChamferedCore(mind2, colors)
  createSquareSegments(mind2, colors)

  return mind2
}