# Discord Host Manager

Manager revolucionário para gerenciar bots do Discord em múltiplas hosts.

## Hosts Suportadas

- Discloud
- SquareCloud
- ShardCloud (em breve)

## Instalação

```bash
npm install
```

## Configuração

1. Copie `.env.example` para `.env`
2. Preencha as variáveis:

```env
DISCORD_TOKEN=seu_token_aqui
DISCLOUD_API_TOKEN=seu_token_discloud
SQUARECLOUD_API_TOKEN=seu_token_squarecloud
```

## Build e Execução

```bash
npm run build
npm start
```

## Comandos

- `/panel` - Abre o painel interativo de gerenciamento
- `/deploy` - Faz deploy direto com arquivo anexado

## Painel Interativo

O painel oferece interface completa com botões e menus:
- Selecionar host
- Listar apps
- Ver status detalhado
- Iniciar/Parar/Reiniciar apps
- Ver logs
- Deploy via URL
