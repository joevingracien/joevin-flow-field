# TSL Flow Field Starter

A modern starter template combining **Three.js WebGPU/TSL**, **Cloudflare Workers**, and **TanStack Start** for building GPU-accelerated visual experiences.

## Tech Stack

- **[Three.js WebGPU](https://threejs.org/)** - Next-gen rendering with TSL (Three.js Shading Language)
- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework with file-based routing
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Edge deployment with SSR
- **[Rolldown-Vite](https://rolldown.rs/)** - Rust-based bundler (experimental)
- **[React 19](https://react.dev/)** - With React Compiler for auto-memoization
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first styling

## Prerequisites

- Node.js 18+
- A WebGPU-compatible browser:
  - Chrome/Edge 113+
  - Firefox 141+
  - Safari 26+

> **Note:** WebGPU is now supported in all major browsers. The app will display a fallback message on older browser versions.

## Getting Started

```bash
# Clone the repository
git clone <your-repo-url>
cd joevin-flow-field

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a WebGPU-compatible browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run lint` | Run OXC linter |
| `npm run lint:fix` | Run OXC linter with auto-fix |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
src/
├── routes/              # TanStack Router file-based routing
│   ├── __root.tsx       # Root layout
│   └── index.tsx        # Home page
├── components/
│   └── canvas/          # WebGPU/Three.js components
│       ├── WebGPUScene.tsx      # Scene wrapper with WebGPU renderer
│       ├── FlowField.tsx        # GPU particle system (262k particles)
│       ├── FlowField.types.ts   # Type definitions
│       └── Gravity.tsx          # Example sketch
├── lib/
│   └── tsl/             # TSL shader utilities
│       ├── noise/       # Noise functions (Simplex, Perlin, Curl, FBM)
│       ├── flow-field/  # Flow field generators
│       └── utils/       # SDF and color utilities
├── hooks/               # React hooks
├── sketches/            # Example sketch implementations
└── app.css              # Global styles
```

## Key Concepts

### TSL (Three.js Shading Language)

TSL is Three.js's node-based shader system for WebGPU. Instead of writing GLSL strings, you write shaders in JavaScript:

```typescript
import { Fn, float, sin, cos } from 'three/tsl'

const myShader = Fn(([angle]) => {
  return vec2(cos(angle), sin(angle))
})
```

### FlowField Component

The `FlowField` component is a GPU-accelerated particle system. Customize it with your own flow field function:

```tsx
import { FlowField } from '@/components/canvas/FlowField'
import { gravity8 } from '@/lib/tsl/flow-field'

<FlowField
  flowFieldFn={gravity8}
  particlesCount={262144}  // 2^18
  particleSpeed={0.01}
  updateFlowField={true}
/>
```

### Creating Custom Flow Fields

```typescript
// src/lib/tsl/flow-field/my-flow-field.ts
import { Fn, instanceIndex, floor, float, vec2, atan } from 'three/tsl'
import { simplexNoise3d } from '@/lib/tsl/noise'

export const myFlowField = Fn((props) => {
  const { rows, columns, flowFieldBuffer } = props

  const x = floor(float(instanceIndex.mod(columns)))
  const y = floor(float(instanceIndex.div(columns)))
  const pos = vec2(x.div(columns), y.div(rows))

  // Your custom logic here
  const angle = simplexNoise3d(pos.mul(4.0))

  flowFieldBuffer.element(instanceIndex).assign(angle)
})
```

## Deployment

### Cloudflare Workers

1. Install Wrangler CLI (included in devDependencies)
2. Authenticate: `npx wrangler login`
3. Deploy: `npm run deploy`

The app deploys to Cloudflare's edge network with SSR handled by Workers.

### Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

For Cloudflare Workers, use `.dev.vars` for local secrets or the Cloudflare dashboard for production secrets.

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 113+ | Full |
| Edge | 113+ | Full |
| Firefox | 141+ | Full |
| Safari | 26+ | Full |
| Mobile Chrome | 121+ | Full |
| Mobile Safari | 26+ | Full |

Unsupported browsers will see a fallback message instead of the 3D scene.

## Performance Notes

- The particle system runs 262,144 particles at 60fps using WebGPU compute shaders
- React Compiler automatically memoizes components
- Rolldown provides fast builds with Rust-based bundling
- `AdaptiveDpr` adjusts resolution based on performance

## License

MIT

---

Built with TSL, Cloudflare Workers, and TanStack Start.
