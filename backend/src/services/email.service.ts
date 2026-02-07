import { ApiError } from "../utils/ApiError.js";
import axios from 'axios';

function mustGetEnv(name: string) {
  const val = process.env[name];
  if (!val) throw new ApiError(500, "CONFIG_ERROR", `Missing env var: ${name}`);
  return val;
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  try {
    await axios.post(
      BREVO_API_URL,
      {
        sender: {
          email: mustGetEnv("BREVO_SENDER_EMAIL"),
          name: mustGetEnv("BREVO_SENDER_NAME"),
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      },
      {
        headers: {
          "api-key": mustGetEnv("BREVO_API_KEY"),
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(
        "Brevo API error:",
        err.response?.data || err.message
      );
    } else if (err instanceof Error) {
      console.error("Unexpected error:", err.message);
    } else {
      console.error("Unknown error while sending email");
    }

    throw new ApiError(502, "EMAIL_FAILED", "Failed to send email");
  }
}

export async function sendOtpEmail(to: string, otp: string) {
  await sendEmail({
    to,
    subject: "Verify your email",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
}
