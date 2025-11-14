/**
 * @license Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
 *
 * This sketch is licensed under CC BY-NC-SA 4.0. You are free to:
 * - Share and adapt this work
 * - Use modified versions commercially
 *
 * Under these conditions:
 * - Attribution: Credit Ben McCormick (phobon) and link to this project
 * - NonCommercial: Don't sell the original, unmodified sketch
 * - ShareAlike: Distribute derivatives under the same license
 */

"use client";

import { FlowField } from "./FlowField";
import { gravity8 } from "@/components/tsl/flow_field/attractor_repulsor_functions";

/**
 * Gravity 8 - Hybrid Flow Field
 *
 * Explores particle systems influenced by attractors, repulsors, and noise in a flow field.
 * Creates dynamic, organic patterns where particles are drawn toward or pushed away from
 * specific points while being influenced by simplex noise, creating flowing, gravitational-like behaviors.
 *
 * Key Features:
 * - Attractor influence: Particles drawn to specific points
 * - Repulsor influence: Particles pushed away from points
 * - Noise field: Organic variation through simplex noise
 * - Multi-influence blending: All forces combined for complex motion
 * - 524,288 particles (2^19) for rich visual density
 *
 * @license Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
 */
export const Gravity = () => {
  return (
    <FlowField
      flowFieldFn={gravity8}
      rows={1024}
      columns={1024}
      particlesCount={Math.pow(2, 18)}
      particleScale={0.002}
      particleOpacity={0.15}
      particleSpeed={0.01}
      particleLifespan={1}
      particleDecay={0.001}
      updateFlowField={true}
    />
  );
};

export default Gravity;
