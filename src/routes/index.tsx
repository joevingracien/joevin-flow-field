import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { ParticlesWebGPU } from "@/components/canvas/ParticlesWebGPU";
import { Component, ReactNode } from "react";
import * as THREE from "three/webgpu";

export const Route = createFileRoute("/")({ component: Home });

// Simple error boundary component
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function Home() {
  return (
    <section className="relative flex h-[80svh] lg:h-[90vh]">
      <ErrorBoundary
        fallback={
          <div className="flex h-full w-full items-center justify-center text-white/50">
            Failed to load 3D scene
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          className="h-screen w-screen absolute inset-0"
          gl={async (props: any) => {
            const renderer = new THREE.WebGPURenderer({
              canvas: props.canvas,
              antialias: true,
              forceWebGL: false,
            });
            await renderer.init();
            return renderer as any;
          }}
          dpr={[1, 2]}
        >
          <ParticlesWebGPU />
        </Canvas>
      </ErrorBoundary>
    </section>
  );
}
