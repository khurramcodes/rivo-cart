import { sendNotificationEmail as sendNotificationEmailViaProvider } from "../../services/email.service.js";

export async function sendNotificationEmail(input: {
  to: string;
  subject: string;
  message: string;
}) {
  await sendNotificationEmailViaProvider(input);
}
