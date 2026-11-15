import {renderSessionChatLocalPrompt,sessionChatLocalPromptReceipt} from '../src/session-chat-local-prompt.mjs';
if(process.argv.includes('--receipt'))process.stdout.write(JSON.stringify(sessionChatLocalPromptReceipt(),null,2)+'\n');
else process.stdout.write(renderSessionChatLocalPrompt()+'\n');
