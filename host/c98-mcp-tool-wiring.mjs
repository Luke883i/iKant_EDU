import {isC98PlainDataRecord} from './c98-c82-connector-port.mjs';
import {executeC98RegisteredAppTurn} from './c98-app-host-ingress.mjs';

// Deployment seam for the existing plugins/ikant-le-session-chat server.
// The backend MUST own readCurrentTurnEnvelope(ctx) and authentic source bytes.
// MCP tool arguments are NOT the authenticated original human message.
const fail=edge=>Object.freeze({schema:'ikant-le-c98-mcp-registration/v1',
 status:'C98_MCP_WIRING_STOP',first_unclosed_edge:edge,
 app_installed_attested:false,native_host_event_attested:false,active:false});
export function wireC98ToInstalledMCP({registerAppTool,server,hostPort,emptyInputSchema,
 outputStatusSchema}={}){
 if(typeof registerAppTool!=='function'||!server||
    !isC98PlainDataRecord(hostPort)||
    Object.keys(hostPort).join(',')!=='readCurrentTurnEnvelope'||
    typeof hostPort.readCurrentTurnEnvelope!=='function'||
    !emptyInputSchema||!outputStatusSchema)
  return fail('INSTALLED_MCP_SERVER_AND_TRUSTED_PORT_REQUIRED');
 const name='ikant_le_c98_experimental_turn';
 registerAppTool(server,name,{
  title:'iKant experimental owner turn',
  description:'Only an installed backend can obtain actual current host ingress and C77 evidence. No model-supplied input or receipt; noncanonical, non-ACTIVE.',
  inputSchema:emptyInputSchema,outputSchema:outputStatusSchema,
  annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false}
 },async(args,ctx)=>{
  // Nothing the model puts in tool arguments may establish original ingress.
  if(!isC98PlainDataRecord(args)||Object.keys(args).length!==0)
   return {content:[],structuredContent:fail('MODEL_SUPPLIED_INGRESS_NOT_AUTHORITY')};
  const bound=Object.freeze({readCurrentTurnEnvelope:()=>hostPort.readCurrentTurnEnvelope(ctx)});
  const receipt=await executeC98RegisteredAppTurn({registeredHostPort:bound});
  // This is ONLY typed data. No fabricated native presentation ACK.
  return {content:[],structuredContent:receipt};
 });
 return Object.freeze({schema:'ikant-le-c98-mcp-registration/v1',
  status:'C98_MCP_TOOL_REGISTERED_IN_PROCESS_NOT_PLATFORM_INSTALLED',
  tool_name:name,app_installed_attested:false,native_host_event_attested:false,
  active:false});
}
