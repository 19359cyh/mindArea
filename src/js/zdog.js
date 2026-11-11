import Zdog from 'zdog'
import { TunaCan, WaterBottle } from './goods'
import { Mind1, Mind2 } from './mind'

export function createGeo(svg) {
  // rendering sizes
  const zoom = 4;
  const sceneWidth = 16;
  const sceneHeight = 16;
  let viewWidth = sceneWidth * zoom;
  let viewHeight = sceneHeight * zoom;
  let svgWidth = Number(svg.getAttribute('width'));
  let svgHeight = Number(svg.getAttribute('height'));
  // set viewBox using zoom
  svg.setAttribute( 'viewBox', `${-viewWidth/2}  ${-viewHeight/2} ` +
    `${viewWidth} ${viewHeight}` );
  // rendering variable
  let isSpinning = true;
  const TAU = Zdog.TAU;
  let animationFrame;

  const scene = new Zdog.Anchor();
  const tunaCan = TunaCan(scene, -9, 0, 0);
  const waterBottle = WaterBottle(scene, 9, 0, 0);
  const mind1 = Mind1(scene, 0, 15, 0);
  const mind2 = Mind2(scene, 15, 15, 0);
  const solids = [tunaCan, waterBottle, mind1, mind2];

  const baseRotations = solids.map((solid) => ({
    x: solid.rotate.x,
    y: solid.rotate.y,
    z: solid.rotate.z,
  }));
  const viewRotation = new Zdog.Vector();
  const keyframes = [
    { x: 0, y: 0 },
    { x: 0, y: TAU },
    { x: TAU, y: TAU },
  ];
  const cycleCount = 180;
  let ticker = 0;
  const turnLimit = keyframes.length - 1;

  // ----- animate ----- //

  function animate() {
    update();
    scene.updateGraph();
    render();
    animationFrame = requestAnimationFrame(animate);
  }

  function update() {
    if (isSpinning) {
      const progress = ticker / cycleCount;
      const tween = Zdog.easeInOut(progress % 1, 4);
      const turn = Math.floor(progress % turnLimit);
      const keyA = keyframes[turn];
      const keyB = keyframes[turn + 1];

      viewRotation.x = Zdog.lerp(keyA.x, keyB.x, tween);
      viewRotation.y = Zdog.lerp(keyA.y, keyB.y, tween);
      ticker += 1;
    }

    solids.forEach((solid, index) => {
      solid.rotate.set({
        x: baseRotations[index].x + viewRotation.x,
        y: baseRotations[index].y + viewRotation.y,
        z: baseRotations[index].z,
      });
    });
  }

  function render() {
    empty( svg );
    scene.renderGraphSvg( svg );
  }

  animate();

  function empty( element ) {
    while ( element.firstChild ) {
      element.removeChild( element.firstChild );
    }
  }

  // ----- drag ----- //

  let dragStartRX, dragStartRY;
  let minSize = Math.min(svgWidth, svgHeight);

  // add drag-rotatation with Dragger
  new Zdog.Dragger({
    startElement: svg,
    onDragStart: function() {
      isSpinning = false;
      dragStartRX = viewRotation.x;
      dragStartRY = viewRotation.y;
    },
    onDragMove: function( pointer, moveX, moveY ) {
      viewRotation.x = dragStartRX - (moveY / minSize * TAU);
      viewRotation.y = dragStartRY - (moveX / minSize * TAU);
    },
  });

  return () => cancelAnimationFrame(animationFrame);
}
