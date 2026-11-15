/** P0 HOST-only readiness disclosure. No caller signal is a native provider receipt.
 * Native registration, a real opened thread and visible 10-turn continuity are
 * external release gates; this helper does not make them true.
 */
export function assessP0ThreadPanelReadiness({panelRequested=false,sessionBound=false,snapshotOk=false}={}){
 if(panelRequested!==true)return Object.freeze({schema:'ikant-le-p0-panel-readiness/v1',
  candidate_ready:false,first_edge:'THREAD_PANEL_FLAG_OFF',fallback:'SIX_SLOT_TEXT',
  native_panel_attested:false,provider_event_attested:false,authority:0});
 if(sessionBound!==true)return Object.freeze({schema:'ikant-le-p0-panel-readiness/v1',
  candidate_ready:false,first_edge:'GATEWAY_SESSION_BINDING_UNVERIFIED',fallback:'SIX_SLOT_TEXT',
  native_panel_attested:false,provider_event_attested:false,authority:0});
 if(snapshotOk!==true)return Object.freeze({schema:'ikant-le-p0-panel-readiness/v1',
  candidate_ready:false,first_edge:'THREAD_SNAPSHOT_NOT_VERIFIED',fallback:'SIX_SLOT_TEXT',
  native_panel_attested:false,provider_event_attested:false,authority:0});
 return Object.freeze({schema:'ikant-le-p0-panel-readiness/v1',candidate_ready:true,
  first_edge:'PROVIDER_REGISTERED_THREAD_PANEL_NOT_ATTESTED',fallback:'SIX_SLOT_TEXT_UNTIL_PROVIDER_PROOF',
  native_panel_attested:false,provider_event_attested:false,authority:0});
}
