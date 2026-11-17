/** C143 EDU policy-facing entrypoint; distinct restricted nonidentity policy retained.
 * No C139 authorization can substitute for a C143 policy verdict.
 */
import {executeVersionedEduTurn,inspectVersionedEduLedger} from './versioned-edu-turn-core.mjs';
export {preflightC107Shape} from './versioned-edu-turn-core.mjs';
export function inspectC107Ledger(file){return inspectVersionedEduLedger(file,'C143');}
export function executeC143GuardedTurn(args={}){return executeVersionedEduTurn('C143',args);}
