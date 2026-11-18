import Zdog from 'zdog'
import Zfont from 'zfont'

Zfont.init(Zdog)

const textValue = 'your mindset'
const textColor = '#FFD136'
const textValue_2 = 'N-MART'
const textColor_2 = '#5CE6DE'
const textValue_3 = 'get it'
const textColor_3 = '#FF8000'
const textDepth = 1.8

export function createTextLayers(scene) {
  const font = new Zdog.Font({ src: '/fonts/Roboto.ttf' })
  const textGroup = new Zdog.Anchor({ addTo: scene })

  const textConfigs = [
    {
      value: textValue,
      color: textColor,
      rotate: { x: 0, y: 0, z: 0 },
    },
    {
      value: textValue_2,
      color: textColor_2,
      rotate: { x: 0, y: Zdog.TAU / 4, z: 0 },
    },
    {
      value: textValue_3,
      color: textColor_3,
      rotate: { x: Zdog.TAU / 4, y: 0, z: 0 },
    },
  ]

  for (const config of textConfigs) {
    for (let layer = textDepth; layer > 0; layer -= 0.3) {
      new Zdog.Text({
        addTo: textGroup,
        font,
        value: config.value,
        fontSize: 8,
        textAlign: 'center',
        textBaseline: 'middle',
        rotate: config.rotate,
        color: config.color,
        fill: true,
        stroke: 0,
      })
    }
  }

  return textGroup
}
