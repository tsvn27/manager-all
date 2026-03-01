# Discord Host Manager

Manager completo para gerenciar bots do Discord em múltiplas hosts com interface interativa.

## ✨ Novidades v1.4.0,0

- 🔐 **Sistema de Permissões** - Controle quem pode usar o bot
- ⏱️ **Rate Limiting** - Proteção contra spam
- 🎨 **Components V2** - Interface moderna do Discord
- 📚 **Documentação Completa** - Guias de instalação e uso

## Hosts Suportadas

- ✅ **Discloud** - Host brasileira popular
- ✅ **SquareCloud** - Host brasileira com recursos avançados
- ✅ **ShardCloud** - Host brasileira moderna com API completa
- ✅ **SparkedHost** - Host internacional
- ✅ **Railway** - Plataforma moderna de deploy
- ✅ **Replit** - IDE online com hosting

## Recursos

### 🚀 Deploy e Gerenciamento
- Deploy automático com upload de .zip
- Iniciar/Parar/Reiniciar apps
- Deletar apps com confirmação
- Migração entre hosts

### 📊 Monitoramento
- Dashboard com estatísticas de todos os apps
- Auto-restart quando apps caem
- Monitoramento em tempo real
- Notificações em canal do Discord

### 📝 Logs e Debug
- Visualização de logs em tempo real
- Filtros (Todos, Erros, Avisos, Info)
- Busca de texto específico nos logs

### 🔐 Variáveis de Ambiente
- Adicionar/Editar/Deletar variáveis
- Valores mascarados para segurança
- Exportar arquivo .env
- Auto-extração de .env do .zip no deploy

### 🔒 Segurança e Controle
- Sistema de permissões (Admins, Usuários, Roles)
- Rate limiting configurável
- Comandos públicos/privados
- Histórico de deploys

### ⚙️ Configurações
- Gerenciar tokens de API das hosts
- Ativar/Desativar hosts
- Configurações globais de backup
- Adicionar novas hosts customizadas
- Backup automático antes de deploy

## 📦 Instalação Rápida

```bash
# Clone o repositório
git clone <seu-repositorio>
cd manigger-all

# Instale as dependências
npm install

# Configure o .env
cp .env.example .env
# Edite .env e adicione seu DISCORD_TOKEN

# Configure o primeiro admin
# Crie permissions.json com seu User ID

# Inicie o bot
npm start
```

📖 **[Guia Completo de Instalação](INSTALL.md)**

## 🎮 Comandos

- `/panel` - Painel interativo de gerenciamento
- `/deploy` - Fazer deploy de um bot (.zip anexado)
- `/dashboard` - Ver estatísticas de todos os apps
- `/permissions` - Gerenciar permissões (apenas admins)

## 🔐 Sistema de Permissões

### Níveis de Acesso
1. **Admins** - Acesso total + gerenciar permissões
2. **Usuários Permitidos** - Podem usar todos os comandos
3. **Roles Permitidas** - Membros com essas roles podem usar o bot
4. **Comandos Públicos** - Comandos que qualquer um pode usar

### Rate Limits
- Comandos: 10 por minuto por usuário
- Deploys: 5 por hora por usuário

## 📚 Documentação

- [Guia de Instalação](INSTALL.md) - Instalação passo a passo
- [Melhorias](IMPROVEMENTS.md) - Lista de melhorias implementadas
- [Changelog](CHANGELOG.md) - Histórico de versões

## 🏗️ Estrutura do Projeto

```
src/
├── commands/          # Comandos slash do Discord
│   ├── panel.ts       # Painel interativo
│   ├── deploy.ts      # Deploy de apps
│   ├── dashboard.ts   # Dashboard de estatísticas
│   └── permissions.ts # Gerenciar permissões
├── handlers/          # Handlers de interações
│   └── interactions.ts
├── managers/          # Gerenciadores de funcionalidades
│   ├── ConfigManager.ts
│   ├── HostManager.ts
│   ├── MonitorManager.ts
│   ├── PermissionManager.ts
│   └── ...
├── providers/         # Providers para cada host
│   ├── DiscloudProvider.ts
│   ├── SquareCloudProvider.ts
│   ├── ShardCloudProvider.ts
│   └── ...
├── types/            # Tipos TypeScript
│   └── index.ts
└── utils/            # Utilitários
    ├── zipHelper.ts
    └── messageBuilder.ts
```

## 🔄 Atualização

```bash
git pull
npm install
npm start
```

## 🐛 Troubleshooting

Consulte o [Guia de Instalação](INSTALL.md#-troubleshooting) para soluções de problemas comuns.

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📞 Suporte

- Abra uma issue no GitHub
- Consulte a documentação em [INSTALL.md](INSTALL.md)
- Verifique o [CHANGELOG.md](CHANGELOG.md) para novidades
