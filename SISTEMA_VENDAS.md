# Sistema de Vendas de Hospedagem

Sistema completo para vender planos de hospedagem através do Discord.

## Comandos

### Para Administradores

- `/panel` - Painel administrativo completo
  - **Planos** - Criar, editar, ativar/desativar planos
  - **Pagamentos** - Configurar métodos de pagamento
  - **Clientes** - Ver lista de clientes e suas aplicações
  - Dashboard, Configurações, Monitoramento, etc.

- `/deploy` - Deploy de aplicações

- `/sendplans <canal>` - Envia a mensagem de planos em um canal
  - Cria um container bonito com todos os planos ativos
  - Usuários podem clicar em "Comprar Agora" para adquirir

- `/sendapp <canal> <cliente> <appid>` - Envia o container de gerenciamento de uma aplicação
  - Cria um container personalizado para o cliente gerenciar sua app
  - Botões: Ligar, Desligar, Reiniciar, Ver Logs, Status, Renovar, Auto-renovar

### Para Clientes

- `/panel` - Acessar "Minhas Apps" para gerenciar aplicações compradas
- Clicar nos containers enviados pelo admin para comprar planos ou gerenciar apps

## Funcionalidades

### Gerenciamento de Planos

- Criar planos com recursos personalizados (RAM, CPU, Storage)
- Definir preço e duração
- Ativar/desativar planos
- Vincular planos a hosts específicas

### Sistema de Pagamento

- Suporte para múltiplos métodos:
  - PIX
  - MercadoPago
  - Stripe
  - PayPal
- Configuração de API keys
- Ativar/desativar métodos

### Gerenciamento de Clientes

- Registro automático de clientes
- Histórico de transações
- Controle de expiração de planos
- Auto-renovação opcional
- Transferência de posse

### Controle de Aplicações (Containers Personalizados)

Admin envia containers de gerenciamento com `/sendapp`. Clientes podem:
- **Ligar** - Iniciar aplicação
- **Desligar** - Parar aplicação
- **Reiniciar** - Reiniciar aplicação
- **Ver Logs** - Visualizar logs da aplicação
- **Status Detalhado** - Ver uso de recursos (CPU, RAM, uptime)
- **Renovar Plano** - Renovar antes do vencimento
- **Auto-renovar** - Ativar/desativar renovação automática
- **Transferir Posse** - Transferir aplicação para outro usuário

## Estrutura de Dados

### Planos (plans.json)
```json
{
  "id": "plan_123",
  "name": "Básico",
  "hostName": "squarecloud",
  "price": 15.00,
  "duration": 30,
  "resources": {
    "ram": "512MB",
    "cpu": "1 Core",
    "storage": "1GB"
  },
  "features": [],
  "active": true
}
```

### Clientes (customers.json)
```json
{
  "userId": "123456789",
  "applications": [
    {
      "id": "app_123",
      "appId": "abc123",
      "hostName": "squarecloud",
      "planId": "plan_123",
      "purchaseDate": 1234567890,
      "expiryDate": 1234567890,
      "autoRenew": false,
      "status": "active"
    }
  ],
  "transactions": []
}
```

### Métodos de Pagamento (payments.json)
```json
{
  "id": "pm_123",
  "name": "PIX",
  "type": "pix",
  "enabled": true,
  "config": {
    "pixKey": "chave@pix.com"
  }
}
```

## Fluxo de Compra

1. Admin cria planos no `/panel` > "Planos"
2. Admin usa `/sendplans #canal-vendas` para enviar a mensagem de planos
3. Cliente vê a mensagem e clica em "Comprar Agora" no plano desejado
4. Cliente escolhe método de pagamento
5. Sistema gera link/QR code de pagamento
6. Após confirmação do pagamento, admin cria a aplicação na host
7. Admin usa `/sendapp #canal-cliente @cliente appid` para enviar o container de gerenciamento
8. Cliente gerencia sua aplicação através do container personalizado

## Expiração e Renovação

- Sistema verifica automaticamente aplicações expiradas
- Aplicações com auto-renovação são renovadas automaticamente
- Notificações são enviadas antes da expiração
- Aplicações expiradas ficam com status "expired"

## Segurança

- Clientes só podem gerenciar suas próprias aplicações
- Transferência de posse requer confirmação
- Dados sensíveis (tokens, chaves) armazenados em arquivos ignorados pelo git
- Permissões separadas para admin e clientes

## Próximos Passos

1. Integrar com gateways de pagamento reais
2. Implementar webhook de confirmação de pagamento
3. Adicionar sistema de cupons/descontos
4. Criar dashboard web para clientes
5. Implementar sistema de tickets/suporte
