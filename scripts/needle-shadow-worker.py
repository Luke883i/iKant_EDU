#!/usr/bin/env python3
"""Source-bound optional Needle 3 inference. No run(), no function execution."""
import json
import os
import sys
os.environ["NEEDLE_TELEMETRY"] = "0"
os.environ["DO_NOT_TRACK"] = "1"
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

TOOLS = [
 {"name":"route_hint","description":"Non-authoritative metadata proposal, never an iKant owner decision",
  "parameters":{"type":"object","properties":{"route":{"type":"string","enum":["UNKNOWN","OPERATIONAL","GENERAL_STUDY"]}},
   "required":["route"],"additionalProperties":False}},
 {"name":"extract_slots","description":"Propose up to four non-sensitive field names, never user values",
  "parameters":{"type":"object","properties":{"fields":{"type":"array","items":{"type":"string","maxLength":64},"maxItems":4}},
   "required":["fields"],"additionalProperties":False}},
]
def main():
 raw=sys.stdin.buffer.readline(16386)
 if len(raw)>16385 or not raw.endswith(b"\n"): raise ValueError("invalid length")
 req=json.loads(raw.decode("utf-8"))
 if type(req) is not dict or set(req)!={"input"}: raise ValueError("payload")
 txt=req["input"]
 if not isinstance(txt,str) or not txt or len(txt.encode("utf-8"))>8192 or "\x00" in txt: raise ValueError("text")
 import needle
 agent=needle.Needle(tools=TOOLS,auto_date=False)
 try:
  response=agent.complete(txt,max_new_tokens=128)
  if not isinstance(response,dict):raise ValueError("model response")
  # Exactly structural fields. Never return 'reasoning', text, tool outputs or call results.
  result={k:response.get(k) for k in ("type","confidence","function_calls")}
  data=json.dumps(result,ensure_ascii=False,separators=(",",":"))
  if len(data.encode("utf-8"))>4095: raise ValueError("output over budget")
  sys.stdout.write(data+"\n")
 finally:
  agent.reset()
if __name__=="__main__":
 try: main()
 except Exception:
  # No input, exception or sensitive data in stdout/stderr.
  sys.stdout.write('{"type":"error","function_calls":[]}\n')
  sys.exit(2)
