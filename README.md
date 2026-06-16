# Passei

<p align="center">
  <img src="assets/icon.png" alt="Logo do Passei" width="220" style="border-radius: 54px;" />
</p>

Aplicativo mobile para estudantes universitários brasileiros acompanharem suas notas e saberem exatamente o que precisam para passar em cada matéria.

---

## Integrantes

| Nome |
|------|
| Anna Beatriz Silva Lima |
| Fatima Pereira Santos Pinho |
| Ian Salomão da Silva Carneiro |
| Rebeca Helen Batista Amorim |
| Valeria Soares Santos |

---

## Problema resolvido

Professores costumam demorar — ou esquecer — de lançar notas no portal oficial da faculdade. O aluno fica sem saber sua situação real em cada matéria: já passou? Ainda dá pra recuperar? Quantos pontos precisa tirar na próxima prova?

O **Passei** responde a essa pergunta de forma clara e matematicamente correta, sem depender do portal da faculdade.

---

## Público-alvo

Estudantes universitários brasileiros, especialmente os matriculados em instituições que usam o sistema de pontuação OAT/VA (Oficina de Aprendizado Tutorial / Verificação de Aprendizagem).

---

## Tecnologias utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Framework mobile | React Native (Expo) |
| Linguagem | TypeScript |
| Autenticação e banco de dados | Supabase (Auth + PostgreSQL + RLS) |
| Navegação | React Navigation (Stack Navigator) |
| Estilo | StyleSheet nativo (mobile-only) |

Sem backend customizado — toda a lógica vive no client (React Native) ou em triggers/policies no PostgreSQL do Supabase.

---

## Estrutura do projeto

```
/src
  /screens              # Uma pasta por tela
    /Auth               # Login e cadastro
    /Home               # Lista de matérias com status
    /AdicionarMateria   # Formulário de nova matéria
    /DetalheMateria     # Resumo + lista de atividades da matéria
    /LancarNota         # Bottom sheet para registrar pontuação
    /EditarAtividades   # Edição de atividades com validação de soma = 100
    /QuantoPreciso      # Feature central: "vou passar?"
    /Configuracoes      # Perfil, percentual default e logout
  /components           # Componentes compartilhados (Card, Badge, Button…)
  /lib                  # Cliente Supabase e helpers
  /hooks                # Custom hooks (useMaterias, useAtividades…)
  /utils                # Funções puras (calcularMeta, formatarPontos…)
  /navigation           # Configuração do React Navigation
  /types                # Types TypeScript do domínio
/supabase
  /migrations           # SQL versionado do banco
/docs
  /especificacao-telas.md
  /plano-de-trabalho.html
```

---

## Como executar

### Pré-requisitos

- Node.js 18+
- Expo CLI
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/IanSalomao/passei-app.git
cd passei-app

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

Preencha o `.env` com suas credenciais do Supabase:

```env
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_ANON_KEY=<sua-anon-key>
```

### Rodando o app

```bash
# Android
npm run android

# iOS
npm run ios

# Expo Go (QR Code)
npm start
```
