import type { onStatelessPayload } from "@hocuspocus/server";
import { DocumentCollaborativeEvents } from "@operoz/editor/lib";
import type { TDocumentEventsServer } from "@operoz/editor/lib";

/**
 * Broadcast the client event to all the clients so that they can update their state
 * @param param0
 */
export const onStateless = async ({ payload, document }: onStatelessPayload) => {
  const response = DocumentCollaborativeEvents[payload as TDocumentEventsServer]?.client;
  if (response) {
    document.broadcastStateless(response);
  }
};
