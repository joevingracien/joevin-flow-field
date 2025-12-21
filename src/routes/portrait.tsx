import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { Component, ReactNode, Suspense, lazy } from "react";

const WebGPUScene = lazy(() => import("../components/canvas/WebGPUScene"));
const ParticlePortrait = lazy(() =>
  import("../components/canvas/ParticlePortrait").then((m) => ({
    default: m.ParticlePortrait,
  }))
);

export const Route = createFileRoute("/portrait")({ component: Portrait });

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

function Portrait() {
  return (
    <section className="relative h-screen w-screen bg-black">
      <ErrorBoundary
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-black text-white">
            WebGPU not available
          </div>
        }
      >
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <WebGPUScene
              debug={false}
              style={{
                position: "fixed",
                inset: 0,
              }}
            >
              <ParticlePortrait
                imageSrc="/img/photospaceme.webp"
                resolution={300}
              />
            </WebGPUScene>
          </Suspense>
        </ClientOnly>
      </ErrorBoundary>
    </section>
  );
}
