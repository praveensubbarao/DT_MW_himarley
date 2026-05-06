export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  tool: (name: string, input: unknown) => void;
}

export function createLogger(agentName: string): Logger {
  const prefix = () => `[${agentName}][${new Date().toISOString()}]`;
  return {
    info:  (msg) => console.log(`${prefix()} ${msg}`),
    error: (msg) => console.error(`${prefix()} ERROR: ${msg}`),
    tool:  (name, input) => console.log(`${prefix()} TOOL: ${name} ${JSON.stringify(input)}`),
  };
}
