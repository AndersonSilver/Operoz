# Smoke test — Funções e permissões do board (5.4b-v1)

Checklist rápido para validar que as regras funcionam. Tempo estimado: **15–20 min**.

## Pré-requisitos

- API e web a correr (Docker local ou ambiente de dev).
- Um **board** com pelo menos **um projeto** ligado (`project.board_id` preenchido).
- Três utilizadores no workspace (podem ser contas reais ou a mesma pessoa em janelas anónimas):
  - **A** — admin do workspace (configura Acessar).
  - **B** — membro do workspace (não admin).
  - **C** — opcional, segundo membro para testar «Várias funções».

## 1. Preparar Acessar

1. Como **A**, abra `…/settings/boards/{board}/acesso`.
2. Adicione **B** com função **Observador**.
3. (Opcional) Adicione **C** com **Membro** + **Observador** → deve aparecer «Várias (2 funções)».

## 2. Utilizador SEM linha em Acessar (legado)

| # | Quem | Ação | Resultado esperado |
|---|------|------|-------------------|
| 1 | Membro WS **não** listado em Acessar | Criar card no projeto do board | **Permitido** (regras antigas de projeto) |
| 2 | Idem | Abrir settings do board (campos, tipos) | Só se for **admin WS**; membro WS sem `board.administer` → bloqueado |

## 3. Observador (só comentar / ver seguidores)

Login como **B** (Observador em Acessar):

| # | Ação | Esperado |
|---|------|----------|
| 3 | Criar card | **403** `BOARD_PERMISSION_DENIED` / `items.create` |
| 4 | Editar título de card existente | **403** / `items.edit` |
| 5 | Adicionar comentário | **OK** |
| 6 | Apagar card | **403** / `items.delete` |
| 7 | Abrir `…/settings/boards/{board}/campos` e tentar adicionar campo | **403** (sem `board.administer`) |

## 4. Membro

Altere **B** para função **Membro** (ou use outro utilizador):

| # | Ação | Esperado |
|---|------|----------|
| 8 | Criar card | **OK** |
| 9 | Editar card / mudar estado | **OK** |
| 10 | Apagar card | **403** (Membro não tem `items.delete`) |
| 11 | Comentar | **OK** |

## 5. Member (Com Delete)

| # | Ação | Esperado |
|---|------|----------|
| 12 | Apagar card | **OK** |

## 6. Administrador (função board)

Utilizador com função **Administrador** no board (não precisa ser admin WS):

| # | Ação | Esperado |
|---|------|----------|
| 13 | Criar/editar/apagar cards | **OK** |
| 14 | `…/acesso`, `…/campos`, `…/tipos` — alterar configuração | **OK** (com `board.administer` na API) |
| 15 | Criar função custom em `…/funcoes` | **OK** |

## 7. União de funções

**C** com Membro + Observador:

| # | Ação | Esperado |
|---|------|----------|
| 16 | Criar card | **OK** (Membro concede `items.create`) |

## Registo de falhas

| Data | Passo | Obtido | Notas |
|------|-------|--------|-------|
| | | | |

## Comandos úteis (dev)

Ver funções atribuídas a um e-mail:

```bash
docker compose -f docker-compose-local.yml exec api python manage.py shell -c "
from plane.db.models import Board, BoardMemberRole, User
board = Board.objects.get(slug='SEU_BOARD')
u = User.objects.get(email='email@exemplo.com')
for m in BoardMemberRole.objects.filter(board=board, user=u, deleted_at__isnull=True).select_related('role'):
    print(m.role.name, m.role.slug)
"
```
