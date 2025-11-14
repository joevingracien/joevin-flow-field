import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import Gravity from "@/components/canvas/Gravity";
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
    <section className="relative flex h-[80svh] lg:h-[90vh] bg-black">
      <ErrorBoundary
        fallback={
          <div className="flex h-full w-full items-center justify-center text-white/50">
            Failed to load 3D scene
          </div>
        }
      >
        <Canvas
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
          <OrthographicCamera makeDefault position={[0, 0, 1]} />
          <Gravity />
        </Canvas>
      </ErrorBoundary>
    </section>
  );
}
