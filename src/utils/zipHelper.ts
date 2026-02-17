import AdmZip from 'adm-zip';

export interface SquareCloudConfig {
  main: string;
  memory: number;
  version: string;
  displayName: string;
}

export async function ensureSquareCloudConfig(buffer: Buffer, config?: SquareCloudConfig): Promise<Buffer> {
  const zip = new AdmZip(buffer);
  let entries = zip.getEntries();
  
  console.log('Verificando arquivos no .zip:', entries.map(e => e.entryName));
  
  const rootFolder = entries.find(e => e.isDirectory && e.entryName.match(/^[^/]+\/$/));
  
  if (rootFolder) {
    console.log('Pasta raiz detectada:', rootFolder.entryName);
    const newZip = new AdmZip();
    const prefix = rootFolder.entryName;
    
    entries.forEach(entry => {
      if (entry.entryName === prefix) return;
      if (entry.entryName.startsWith(prefix)) {
        const newPath = entry.entryName.replace(prefix, '');
        if (newPath) {
          if (entry.isDirectory) {
            newZip.addFile(newPath, Buffer.alloc(0));
          } else {
            newZip.addFile(newPath, entry.getData());
          }
        }
      }
    });
    
    buffer = newZip.toBuffer();
    entries = newZip.getEntries();
    console.log('Arquivos após remover pasta raiz:', entries.map(e => e.entryName));
  }
  
  const hasConfig = entries.some(entry => 
    entry.entryName === 'squarecloud.app' || 
    entry.entryName === 'squarecloud.config'
  );

  if (hasConfig) {
    console.log('Arquivo de configuração já existe');
    return buffer;
  }

  const defaultConfig = config || {
    main: detectMainFile(entries),
    memory: 512,
    version: 'recommended',
    displayName: 'Bot'
  };

  console.log('Criando arquivo de configuração com:', defaultConfig);

  const configContent = `MAIN=${defaultConfig.main}
MEMORY=${defaultConfig.memory}
VERSION=${defaultConfig.version}
DISPLAY_NAME=${defaultConfig.displayName}`;

  console.log('Conteúdo do arquivo:', configContent);

  const finalZip = new AdmZip(buffer);
  finalZip.addFile('squarecloud.app', Buffer.from(configContent, 'utf-8'));
  
  const newBuffer = finalZip.toBuffer();
  console.log('Novo .zip criado com tamanho:', newBuffer.length);
  
  return newBuffer;
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
