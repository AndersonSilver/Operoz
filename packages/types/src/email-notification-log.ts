export interface IEmailNotificationLog {
  id: string;
  receiver_email: string;
  receiver_name: string;
  triggered_by_email: string;
  triggered_by_name: string;
  entity: string;
  entity_name: string;
  entity_identifier: string | null;
  old_value: string | null;
  new_value: string | null;
  processed_at: string | null;
  sent_at: string | null;
  created_at: string;
}
