import {CANONICAL_COMPOSITION_HANDOFF_SCHEMA,validateCanonicalCompositionHandoff as validateSharedCanonicalCompositionHandoff} from './bootstrap-semantic.mjs';
import {runtimeRootDescriptor,issueCanonicalCompositionHandoffFromDirect,issueCanonicalSessionChatCompositionFromExecutor} from './runtime-root-verified.mjs';

export {CANONICAL_COMPOSITION_HANDOFF_SCHEMA};
export function validateCanonicalCompositionHandoff(value){const pre=value?.direct_handoff?.execution_input?.preaccept_handoff||null,descriptor=runtimeRootDescriptor();return validateSharedCanonicalCompositionHandoff(value,{sourceHead:value?.source_head??null,runtimeRootSha256:descriptor?.runtime_root_sha256??null,runtimeRootDescriptor:descriptor,orientationObjects:pre?.orientation_objects||[]});}
export function issueCanonicalCompositionHandoff(directHandoff){return issueCanonicalCompositionHandoffFromDirect({sourceHead:directHandoff?.source_head,directHandoff});}
export function issueCanonicalSessionChatComposition({preacceptHandoff,activationExecutor,humanInput,acceptanceObservedMonotonicMs}={}){return issueCanonicalSessionChatCompositionFromExecutor({preacceptHandoff,activationExecutor,humanInput,acceptanceObservedMonotonicMs});}
export function canonicalCompositionExecutionInput(handoff){const v=validateCanonicalCompositionHandoff(handoff);if(!v.ok)throw new Error('canonical composition handoff invalid: '+v.errors.join(','));return structuredClone(handoff.direct_handoff.execution_input);}
