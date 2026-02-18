# Sistema de Vendas de Hospedagem

Sistema completo para vender planos de hospedagem através do Discord.

## Comandos

### Para Clientes

- `/planos` - Ver planos disponíveis e comprar
- `/app` - Gerenciar suas aplicações (ligar, desligar, reiniciar, logs, etc)

### Para Administradores

- `/panel` - Painel administrativo com:
  - **Planos** - Criar, editar, ativar/desativar planos
  - **Pagamentos** - Configurar métodos de pagamento (PIX, MercadoPago, Stripe, PayPal)
  - **Clientes** - Ver lista de clientes e suas aplicações

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

### Controle de Aplicações (Comando /app)

Clientes podem gerenciar suas aplicações:
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

1. Cliente usa `/planos` para ver planos disponíveis
2. Clica em "Comprar" no plano desejado
3. Escolhe método de pagamento
4. Sistema gera link/QR code de pagamento
5. Após confirmação, aplicação é vinculada ao cliente
6. Cliente pode gerenciar via `/app`

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
