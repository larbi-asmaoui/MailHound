# EmailVerifier Go (backend_go)

## Structure du projet (Enterprise Ready)

```
backend_go/
├── cmd/
│   └── server/         # Point d'entrée principal (main.go)
├── internal/
│   ├── api/            # Handlers HTTP (controllers)
│   ├── service/        # Logique métier (validation, SMTP, etc.)
│   ├── model/          # Structs partagées (DTO, entités)
│   ├── infra/          # Accès DB, Redis, queue, etc.
│   └── config/         # Chargement de la config/env
├── pkg/                # Libs réutilisables (optionnel)
├── go.mod
└── go.sum
```

## Lancer le projet

```bash
cd backend_go
# Installer les dépendances
 go mod tidy
# Lancer le serveur
 go run ./cmd/server/main.go
```

## Endpoints principaux

- `POST /api/verify` : Vérification complète d'un email (syntaxe, MX, jetable, role-based, catch-all, SMTP...)
- `GET /api/health` : Health check

## Pour étendre

- Ajouter des services dans `internal/service/`
- Ajouter des handlers dans `internal/api/`
- Ajouter des modèles partagés dans `internal/model/`
- Ajouter des accès DB/Redis dans `internal/infra/`

---

**Projet prêt pour évoluer vers du bulk, de la queue, du multi-worker, etc.**
