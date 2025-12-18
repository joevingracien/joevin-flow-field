import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { Component, ReactNode, Suspense, lazy } from "react";

// Lazy load WebGPU components - combined with ClientOnly prevents SSR issues
const WebGPUScene = lazy(() => import("../components/canvas/WebGPUScene"));
const Gravity = lazy(() => import("../components/canvas/Gravity"));

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
    <section className="relative h-screen w-screen bg-black">
      {/* Subtle under construction message */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 bottom-0 z-10 flex h-screen w-screen items-center justify-center">
        <p className="text-center font-mono text-sm tracking-wider text-white/60">
          ✦ under the stars ✦
        </p>
      </div>
      <ErrorBoundary
        fallback={
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-black p-8 text-center">
            <div className="text-4xl">&#x26A0;</div>
            <h2 className="text-xl font-medium text-white">WebGPU Not Available</h2>
            <p className="max-w-md text-sm text-white/60">
              This experience requires WebGPU. Please update your browser or try a different one.
            </p>
            <div className="mt-2 text-xs text-white/40">
              <p>Supported in all major browsers:</p>
              <ul className="mt-1 space-y-0.5">
                <li>Chrome / Edge 113+</li>
                <li>Firefox 141+</li>
                <li>Safari 26+</li>
              </ul>
            </div>
          </div>
        }
      >
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <WebGPUScene
              debug={true}
              style={{
                position: "fixed",
                inset: 0,
              }}
            >
              <Gravity />
            </WebGPUScene>
          </Suspense>
        </ClientOnly>
      </ErrorBoundary>
    </section>
  );
}
