export interface StreamMessage {
  type: string;
  [key: string]: any;
}

/**
 * Creates a parser for Server-Sent Events (SSE) that can handle streaming messages
 * from the server. This is particularly useful for handling streaming AI responses.
 */
export function createSSEParser() {
  let buffer = '';

  /**
   * Parse a chunk of SSE data and extract messages
   * @param chunk - The chunk of data to parse
   * @returns An array of parsed messages
   */
  const parse = (chunk: string): StreamMessage[] => {
    buffer += chunk;
    const messages: StreamMessage[] = [];
    const lines = buffer.split('\n');
    
    // If the last line is not complete, keep it in the buffer
    buffer = lines.pop() || '';
    
    let message: Record<string, any> = {};
    
    for (const line of lines) {
      if (line.trim() === '') {
        // Empty line indicates the end of a message
        if (Object.keys(message).length > 0) {
          messages.push(message as StreamMessage);
          message = {};
        }
      } else if (line.startsWith('data: ')) {
        try {
          // Parse the JSON data
          const data = JSON.parse(line.slice(6));
          message = { ...message, ...data };
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      }
    }
    
    return messages;
  };

  /**
   * Process a chunk of data and call the onMessage callback for each message
   * @param chunk - The chunk of data to process
   */
  const feed = (chunk: string) => {
    const messages = parse(chunk);
    for (const message of messages) {
      if (typeof onMessage === 'function') {
        onMessage(JSON.stringify(message));
      }
    }
  };

  // This will be set by the consumer
  let onMessage: (message: string) => void = () => {};

  return {
    parse,
    feed,
    onMessage,
  };
}
