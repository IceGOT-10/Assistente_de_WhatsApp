# 🦷 Assistente de WhatsApp com IA & Triagem 24h (OdontoPrime) — v0.1.0

Micro-SaaS B2B voltado para automação de atendimento, esclarecimento de dúvidas e triagem automatizada com pré-agendamento para clínicas odontológicas e centros de estética médica.

---

## 🚀 Tecnologias Utilizadas

* **Runtime & Linguagem:** Node.js (LTS), TypeScript
* **Servidor HTTP:** Express
* **Gateway WhatsApp:** Baileys (Multi-Device com WebSocket nativo)
* **Banco de Dados & ORM:** PostgreSQL 16 (via Docker Compose) e Prisma ORM
* **Inteligência Artificial:** Google Gemini (SDK `@google/genai`) via Google AI Studio
* **Log & Validação:** Pino, Dotenv

---

## ⚡ Funcionalidades da Versão 0.1.0

1. **Buffer Anti-Flood (5 segundos):** Agrupa mensagens fragmentadas enviadas em sequência pelo paciente, consolidando em um único bloco antes de acionar o processamento.
2. **Roteador Híbrido Determinístico:** Respostas instantâneas pré-feitas (< 50ms) para dúvidas estáticas (Localização, Horários, Formas de Pagamento, Lista de Procedimentos e Políticas de Preço), economizando cotas de API.
3. **Injeção de Histórico Contínuo:** As respostas automáticas são inseridas no histórico do Gemini, garantindo contexto imediato caso o paciente continue o cadastro em seguida.
4. **Tool Calling (Extração Estruturada de Leads):** Chamada de função automática (`cadastrar_triagem_paciente`) para coletar e salvar nome, telefone, procedimento, turno preferido e modalidade (Particular ou Convênio) no PostgreSQL.
5. **Máquina de Estados e Ciclo de Sessão:**
   - Encerramento por escolha do paciente (reconhecimento de despedida e flag `[ENCERRAR_ATENDIMENTO]`).
   - Monitor ativo em segundo plano que notifica e expira a sessão após 15 minutos de inatividade.
   - Suporte à alteração de dados no pré-cadastro sem reiniciar a conversa.
   - Tratamento específico para agendamentos de terceiros (exige WhatsApp do paciente real).
6. **Desconexão Remota:** Endpoint e comando interativo para desconectar a conta do WhatsApp e gerar novo QR Code sob demanda.
7. **Simulador CLI Local:** Script integrado para testar fluxos conversacionais diretamente pelo terminal sem consumir aparelhos celulares secundários.

---

## 🛠️ Como Executar o Projeto

### 1. Clonar o Repositório e Instalar Dependências

```bash
git clone [https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git](https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git)
cd SEU_REPOSITORIO
npm install
2. Configurar Variáveis de Ambiente
Crie um arquivo .env na raiz baseado no modelo abaixo:

Snippet de código
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/whatsapp_triage_db?schema=public"
GEMINI_API_KEY="SUA_CHAVE_DO_GOOGLE_AI_STUDIO"
CLINIC_NAME="Clínica OdontoPrime"
BUFFER_DEBOUNCE_MS=5000
3. Subir o Banco de Dados e Executar Migrações
Bash
# Iniciar o PostgreSQL via Docker
docker compose up -d

# Executar as migrações do Prisma
npm run migrate
4. Iniciar a Aplicação
Bash
# Modo de desenvolvimento
npm run dev
5. Testes e Simulação
Simulador Terminal (Sem Celular):

Bash
npm run test:chat
Visualizar Banco de Dados:

Bash
npx prisma studio
