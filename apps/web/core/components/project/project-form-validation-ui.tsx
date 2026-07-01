/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";

/** Mensagem de erro — igual em todo o formulário de projeto (create/edit). */
export const projectFormErrorMessageClass = "mt-1 block text-11 leading-snug text-danger-primary";

export function ProjectFormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={projectFormErrorMessageClass}>{message}</p>;
}

/** Borda vermelha sem fundo pintado (mesmo padrão do `Input` com `hasError`). */
export const projectFormControlErrorClass = "border-danger-strong !border-danger-strong";

/** Anula `bg-danger-subtle` do TextArea em erro para manter só a borda. */
export const projectFormTextAreaErrorBgClass = "!bg-layer-2";

export function withProjectFormControlError(hasError: boolean, ...classes: (string | false | undefined)[]) {
  return cn(classes, hasError && projectFormControlErrorClass);
}
