import { createFileRoute } from "@tanstack/react-router";
import WebGPUScene from "@/components/canvas/WebGPUScene";
import Gravity from "@/components/canvas/Gravity";
import { Component, ReactNode } from "react";

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
    <section className="relative flex h-screen w-screen bg-black">
      <ErrorBoundary
        fallback={
          <div className="flex h-full w-full items-center justify-center text-white/50">
            Failed to load 3D scene
          </div>
        }
      >
        <WebGPUScene
          style={{
            position: "fixed",
            inset: 0,
          }}
        >
          <Gravity />
        </WebGPUScene>
      </ErrorBoundary>

      {/* Subtle under construction message */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className="text-center font-mono text-sm tracking-wider text-white/20">
          ✦ under the stars ✦
        </p>
      </div>
    </section>
  );
}
