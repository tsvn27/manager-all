# Discord Host Manager

Manager completo para gerenciar bots do Discord em múltiplas hosts com interface interativa.

## Hosts Suportadas

- ✅ **Discloud** - Host brasileira popular
- ✅ **SquareCloud** - Host brasileira com recursos avançados
- ✅ **ShardCloud** - Host brasileira moderna com API completa
- ✅ **SparkedHost** - Host internacional
- ✅ **Railway** - Plataforma moderna de deploy
- ✅ **Replit** - IDE online com hosting

## Recursos

- 🚀 Deploy automático com upload de .zip
- 📊 Dashboard com estatísticas de todos os apps
- 🔄 Auto-restart quando apps caem
- 📝 Logs com filtros (erros, avisos, info)
- 🔐 Gerenciamento de variáveis de ambiente
- 📜 Histórico de deploys
- 🔔 Sistema de notificações
- 🔄 Migração entre hosts
- ⚙️ Configurações globais
- 📦 Backup automático antes de deploy

## Instalação

```bash
npm install
```

## Configuração

1. Copie `.env.example` para `.env`
2. Preencha o token do bot:

```env
DISCORD_TOKEN=seu_token_aqui
```

3. Configure as hosts pelo painel do bot usando `/panel`

## Build e Execução

```bash
npm run build
npm start
```

## Comandos

- `/panel` - Abre o painel interativo de gerenciamento
- `/deploy` - Faz deploy com arquivo .zip anexado
- `/dashboard` - Visualiza estatísticas de todos os apps

## Painel Interativo

O painel oferece interface completa com Components V2:

### Gerenciamento de Apps
- Listar todos os apps de uma host
- Ver status detalhado (CPU, RAM, Uptime)
- Iniciar/Parar/Reiniciar apps
- Deletar apps com confirmação

### Logs Avançados
- Visualizar logs em tempo real
- Filtrar por tipo (Todos, Erros, Avisos, Info)
- Buscar texto específico nos logs

### Variáveis de Ambiente
- Adicionar/Editar/Deletar variáveis
- Valores mascarados para segurança
- Exportar arquivo .env
- Auto-extração de .env do .zip no deploy

### Monitoramento
- Auto-restart quando app cai
- Notificações em canal do Discord
- Contador de reinicializações

### Configurações
- Gerenciar tokens de API das hosts
- Ativar/Desativar hosts
- Configurações globais de backup
- Adicionar novas hosts customizadas

## Estrutura do Projeto

```
src/
├── commands/          # Comandos slash do Discord
├── handlers/          # Handlers de interações
├── managers/          # Gerenciadores de funcionalidades
├── providers/         # Providers para cada host
├── types/            # Tipos TypeScript
└── utils/            # Utilitários
```

## Licença

MIT
