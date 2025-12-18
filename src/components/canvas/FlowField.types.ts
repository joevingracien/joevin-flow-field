import type { Node } from 'three/webgpu'
import type { MutableRefObject } from 'react'

/**
 * FlowField component props
 */
export interface FlowFieldProps {
  /** TSL function that defines the flow field behavior */
  flowFieldFn: (props: FlowFieldFnProps) => Node

  /** Optional TSL function for custom particle colors */
  colorNodeFn?: (angle: Node, speed: Node) => Node

  /** Optional TSL function for custom particle opacity */
  opacityNodeFn?: (opacityBuffer: Node) => Node

  /** Number of rows in the flow field grid */
  rows?: number

  /** Number of columns in the flow field grid */
  columns?: number

  /** Depth of the flow field (for 3D flow fields) */
  depth?: number

  /** Total number of particles to simulate */
  particlesCount?: number

  /** Scale/size of each particle */
  particleScale?: number

  /** Base opacity of particles (0-1) */
  particleOpacity?: number

  /** Movement speed of particles */
  particleSpeed?: number

  /** Lifespan of particles before respawn */
  particleLifespan?: number

  /** Rate at which particle lifespan decays */
  particleDecay?: number

  /** Whether to randomize the flow field periodically */
  randomise?: boolean

  /** Which axes to apply flow field angles [x, y, z] */
  flowFieldAngles?: [number, number, number]

  /** Whether to update the flow field every frame */
  updateFlowField?: boolean

  /** Additional parameters to pass to flowFieldFn */
  params?: Record<string, any>

  /** Mouse position ref for interactive flow fields */
  mousePosition?: MutableRefObject<{ x: number; y: number }> | null
}

/**
 * Props passed to flow field function
 */
export interface FlowFieldFnProps {
  rows: number
  columns: number
  depth: number
  flowFieldBuffer: Node
  params?: Record<string, any>
}

/**
 * Mouse position coordinates (normalized 0-1)
 */
export interface NormalizedMousePosition {
  x: number
  y: number
}
