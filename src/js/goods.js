import Zdog from 'zdog'

// 罐頭
export function TunaCan(addTo, x=0, y=0, z=0) {
  const can = new Zdog.Anchor({
    addTo,
    translate: { x, y, z },
    rotate: { x: -Zdog.TAU/2 }
  });

  new Zdog.Cylinder({
    addTo: can,
    diameter: 14.2,
    length: 1,
    translate: { z: -3},
    stroke: false,
    color: '#a2b5bc',
    frontFace: '#91a6ad',
    backface: '#44545c',
  });

  new Zdog.Cylinder({
    addTo: can,
    diameter: 14.1,
    length: 4.5,
    stroke: false,
    color: '#d94b3d',
    frontFace: '#e65b47',
    backface: '#b7352d',
  });

  new Zdog.Ellipse({
    addTo: can,
    diameter: 10,
    translate: { z: -3.5 },
    stroke: 0.5,
    color: '#737d82',
  });

  new Zdog.Shape({
    addTo: can,
    path: [
      { x: -2.3, y: 0 },
      { x: 2.3, y: 0 },
      { x: 2.3, y: 1.1 },
      { x: -2.3, y: 1.1 },
    ],
    translate: { z: -3.5 },
    stroke: 0.6,
    color: '#8e989c',
    fill: true,
  });

  new Zdog.Ellipse({
    addTo: can,
    diameter: 3,
    translate: { y: -1.3, z: -3.6 },
    stroke: 0.5,
    color: '#737d82',
  });

  return can;
}

// 水瓶
export function WaterBottle(addTo, x=0, y=0, z=0) {
  const bottle = new Zdog.Anchor({
    addTo,
    translate: { x, y, z },
    rotate: { x: Zdog.TAU/2.5 }
  });

  new Zdog.Cylinder({
    addTo: bottle,
    diameter: 9,
    length: 12,
    rotate: { x: Zdog.TAU/4 },
    stroke: false,
    color: '#9ed3e0',
    frontFace: '#c4edf3',
    backface: '#5795a5',
  });

  new Zdog.Cylinder({
    addTo: bottle,
    diameter: 5,
    length: 3,
    translate: { y: 7.5 },
    rotate: { x: Zdog.TAU/4 },
    stroke: false,
    color: '#1e4954',
    frontFace: '#06262b',
    backface: '#308193',
  });

  new Zdog.Ellipse({
    addTo: bottle,
    diameter: 9.1,
    translate: { y: 5 },
    rotate: { x: Zdog.TAU/4 },
    stroke: 0.5,
    color: '#5d9caa',
  });

  return bottle;
}