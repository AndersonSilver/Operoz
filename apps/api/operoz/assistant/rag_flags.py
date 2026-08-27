"""Flags do RAG.

Módulo propositalmente sem dependências internas: é importado tanto pelo caminho
de escrita (indexação) quanto pelo de leitura (retrieval), e um import cruzado
entre `indexing`, `index_status` e `indexing_scheduler` fecharia um ciclo.
"""

from __future__ import annotations

from django.conf import settings

_FALSY = ("0", "false", "no")


def is_rag_indexing_enabled() -> bool:
    """Controla a escrita no índice (embeddings + linhas em SearchEmbedding).

    Separado de `retrieval.is_rag_enabled`, que só controla a leitura.
    """
    return str(getattr(settings, "ASSISTANT_RAG_INDEXING_ENABLED", "1")).lower() not in _FALSY
