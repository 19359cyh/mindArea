import { useEffect, useRef } from 'react'
import { createGeo } from './js/zdog'
import './App.css'

function App() {
  const svgRef = useRef(null)

  useEffect(() => {
    return createGeo(svgRef.current)
  }, [])

  return (
    <svg
      className="zdog-canvas"
      ref={svgRef}
      width="320"
      height="320"
      aria-label="Rotating text"
    />
  )
}

export default App
