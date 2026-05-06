# AnatoQuizUp BFF — Makefile
#
# Uso: rode `make help` para ver todos os comandos.
# No Windows, instale o GNU Make antes:
#   choco install make    (Chocolatey)
#   scoop install make    (Scoop)

SHELL := /bin/sh
.DEFAULT_GOAL := help

# ============================================================================
#  Ajuda
# ============================================================================

.PHONY: help
help: ## Lista todos os comandos disponiveis
	@echo ""
	@echo "AnatoQuizUp BFF - comandos disponiveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ============================================================================
#  Setup e dependencias
# ============================================================================

.PHONY: setup
setup: ## Copia .env (se nao existir) e instala dependencias
	@if [ ! -f .env ]; then cp .env.example .env && echo "[setup] .env criado. PREENCHA INTERNAL_TOKEN e JWT_SECRET_KEY (mesmos valores do Backend) antes de continuar."; fi
	npm ci

.PHONY: install
install: ## npm ci
	npm ci

# ============================================================================
#  Desenvolvimento
# ============================================================================

.PHONY: dev
dev: ## Sobe o BFF em watch mode (porta 4000)
	npm run dev

.PHONY: build
build: ## Compila TypeScript para dist/
	npm run build

.PHONY: start
start: ## Roda a build (uso de producao)
	npm start

# ============================================================================
#  Qualidade
# ============================================================================

.PHONY: lint
lint: ## ESLint
	npm run lint

.PHONY: format
format: ## Prettier --write
	npm run format

.PHONY: test
test: ## Testes Jest (sem coverage)
	npm test

.PHONY: test-ci
test-ci: ## Testes com cobertura (gate 85%)
	npm run test:ci

# ============================================================================
#  Diagnostico
# ============================================================================

.PHONY: smoke
smoke: ## Smoke test do health check (precisa do BFF rodando)
	@curl -s http://localhost:4000/health | head -1 || (echo "[smoke] BFF nao esta respondendo em :4000"; exit 1)

# ============================================================================
#  Limpeza
# ============================================================================

.PHONY: clean
clean: ## Remove dist/, coverage/ e node_modules/
	rm -rf dist coverage node_modules
	@echo "[clean] dist/, coverage/ e node_modules/ removidos."
