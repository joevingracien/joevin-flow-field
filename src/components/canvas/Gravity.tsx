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
import { gravity8 } from "@/lib/tsl";
import { useNormalizedMouse } from "@/hooks/useNormalizedMouse";

/**
 * Gravity 8 - Hybrid Flow Field with Mouse Interaction
 *
 * Explores particle systems influenced by attractors, repulsors, and noise in a flow field.
 * Creates dynamic, organic patterns where particles are drawn toward or pushed away from
 * specific points while being influenced by simplex noise, creating flowing, gravitational-like behaviors.
 *
 * Key Features:
 * - Interactive attractor: Particles drawn to mouse cursor position
 * - Repulsor influence: Particles pushed away from static point
 * - Noise field: Organic variation through simplex noise
 * - Multi-influence blending: All forces combined for complex motion
 * - 262,144 particles (2^18) for rich visual density
 *
 * @license Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
 */
export const Gravity = () => {
  // Lower smoothFactor = smoother, more organic mouse following
  const mousePosition = useNormalizedMouse(0.08);

  return (
    <FlowField
      flowFieldFn={gravity8}
      rows={1024}
      columns={1024}
      particlesCount={Math.pow(2, 18)}
      particleScale={0.001}
      particleOpacity={0.12}
      particleSpeed={0.007}
      particleLifespan={1}
      particleDecay={0.001}
      updateFlowField={true}
      mousePosition={mousePosition}
      mouseEmitRatio={0.15} // 15% of particles spawn from mouse cursor (trail effect)
      mouseRepulsionRadius={0.18} // Larger radius for softer gradient (no harsh edge)
      mouseRepulsionStrength={0.015} // Gentler force - cubic falloff does the heavy lifting
      mouseRepulsionSwirl={0.45} // Particles flow around cursor, not just away
      mouseRepulsionSpreadFactor={20} // Faster particles scatter more dramatically
      params={{
        swirlAmount: 0.55, // How much particles spiral (0 = direct, 1 = orbit)
        noiseScale: 4.0, // Organic flow field variation
      }}
    />
  );
};

export default Gravity;
