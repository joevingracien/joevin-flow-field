import { createFileRoute } from '@tanstack/react-router'
import { Suspense, useEffect, useRef, useState } from 'react'
import WebGPUScene from '@/components/canvas/webgpu_scene'
import { SketchesDropdown } from '@/components/sketches_dropdown'

export const Route = createFileRoute('/sketches/pixel-sorting/$')({
  component: RouteComponent,
})

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload()
  })
}

function RouteComponent() {
  const { _splat: sketchPath } = Route.useParams()

  const [module, setModule] = useState<any>({})

  // Updated glob pattern to include subfolders
  const sketches: Record<string, { default: () => any }> = import.meta.glob('../sketches/pixel-sorting/**/*.{ts,tsx}', {
    eager: true,
  })

  useEffect(() => {
    // Convert URL path to file path
    const filePath = `../sketches/pixel-sorting/${sketchPath}.ts`
    const tsxPath = `../sketches/pixel-sorting/${sketchPath}.tsx`
    const mod = sketches[filePath] || sketches[tsxPath]

    if (mod) {
      setModule({ Sketch: mod.default })
    } else {
      console.error('Sketch not found:', sketchPath)
    }
  }, [sketchPath])

  const ref = useRef<any>(null)

  const { Sketch } = module

  return (
    <section className='fragments-boilerplate__main__canvas' ref={ref}>
      <Suspense fallback={null}>
        {Sketch ? (
          <WebGPUScene
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
            }}
            eventSource={ref}
            eventPrefix='client'
          >
            <Sketch />
          </WebGPUScene>
        ) : null}
      </Suspense>

      <SketchesDropdown />
    </section>
  )
}
