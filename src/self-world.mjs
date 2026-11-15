export { SELF_WORLD_ROLES,buildObservations,bindObservations,recurWorkspace,recallAutobiography,buildMetaSelf,predictOutcome,selectBoundedPolicy,deriveBodyModel,telemetryCompleteness } from './self-world-core.mjs';
export { emptySelfWorld,updateCausalModel,prepareSelfWorldTurn,finalizeSelfWorldTurn,normalizeSelfWorldState,validateSelfWorldState,validateSelfWorldTurn } from './self-world-state.mjs';
import { K } from './self-world-core.mjs';
export function selfWorldKernel(){return structuredClone(K);}
