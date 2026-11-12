# API de Cargas

API REST didática em Node.js 20, TypeScript, Express e PostgreSQL (`pg`), com SQL escrito à mão e uma trilha de eventos protegida por hashes SHA-256 encadeados.

## Como rodar

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

Testes:

```bash
npm test
```

## Endpoints

- `POST /cargas` — cria uma carga (`descricao`, `origem`, `destino`).
- `GET /cargas` e `GET /cargas/:id` — consulta cargas.
- `POST /cargas/:id/eventos` — adiciona um evento (`tipo`) e calcula seu hash.
- `GET /cargas/:id/eventos` — lista eventos.
- `GET /cargas/:id/verificar` — recalcula a cadeia e retorna `{ "integra": true }` quando válida.
- `GET /relatorios/eventos-por-carga` — relatório com `JOIN`, `COUNT` e `GROUP BY`.

Exemplos:

```bash
curl -X POST http://localhost:3000/cargas \
  -H 'Content-Type: application/json' \
  -d '{"descricao":"Eletrônicos","origem":"São Paulo","destino":"Rio de Janeiro"}'

curl -X POST http://localhost:3000/cargas/1/eventos \
  -H 'Content-Type: application/json' \
  -d '{"tipo":"COLETADA"}'

curl http://localhost:3000/cargas/1/verificar
curl http://localhost:3000/relatorios/eventos-por-carga
```

## O que é simulado

Este é um projeto didático. Ele simula o registro de cargas e a imutabilidade verificável de uma trilha de eventos usando hashes encadeados; não implementa logística real, autenticação, autorização, filas ou integração com transportadoras.
