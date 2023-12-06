
export async function resolveStream(stream: any, raw = false): Promise<Buffer | string> {
      return new Promise((resolve, reject) => {
          const chunks: any[] = []
          stream.on('data', (chunk: any) => chunks.push(chunk))
          stream.on('error', reject)
          stream.on('end', () => resolve(raw ? Buffer.concat(chunks) : Buffer.concat(chunks).toString('utf8')))
      })
  }