import AdmZip from 'adm-zip';

export interface SquareCloudConfig {
  main: string;
  memory: number;
  version: string;
  displayName: string;
}

export async function ensureSquareCloudConfig(buffer: Buffer, config?: SquareCloudConfig): Promise<Buffer> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  
  const hasConfig = entries.some(entry => 
    entry.entryName === 'squarecloud.app' || 
    entry.entryName === 'squarecloud.config'
  );

  if (hasConfig) {
    return buffer;
  }

  const defaultConfig = config || {
    main: detectMainFile(entries),
    memory: 512,
    version: 'recommended',
    displayName: 'Bot'
  };

  const configContent = `MAIN=${defaultConfig.main}
MEMORY=${defaultConfig.memory}
VERSION=${defaultConfig.version}
DISPLAY_NAME=${defaultConfig.displayName}`;

  zip.addFile('squarecloud.app', Buffer.from(configContent, 'utf-8'));
  
  return zip.toBuffer();
}

function detectMainFile(entries: AdmZip.IZipEntry[]): string {
  const possibleMains = [
    'index.js',
    'main.js',
    'bot.js',
    'app.js',
    'src/index.js',
    'src/main.js',
    'index.ts',
    'main.ts',
    'bot.ts',
    'src/index.ts'
  ];

  for (const main of possibleMains) {
    if (entries.some(e => e.entryName === main)) {
      return main;
    }
  }

  const jsFile = entries.find(e => e.entryName.endsWith('.js') && !e.isDirectory);
  if (jsFile) {
    return jsFile.entryName;
  }

  return 'index.js';
}

export function needsSquareCloudConfig(buffer: Buffer): boolean {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  
  return !entries.some(entry => 
    entry.entryName === 'squarecloud.app' || 
    entry.entryName === 'squarecloud.config'
  );
}
