import nodemailer from "nodemailer";
import { ApiError } from "../utils/ApiError.js";

function mustGetEnv(name: string) {
  const val = process.env[name];
  if (!val) throw new ApiError(500, "CONFIG_ERROR", `Missing env var: ${name}`);
  return val;
}

const transporter = nodemailer.createTransport({
  host: mustGetEnv("SMTP_HOST"),
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "false",
  auth: {
    user: mustGetEnv("SMTP_USER"),
    pass: mustGetEnv("SMTP_PASS"),
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

export async function sendOtpEmail(to: string, otp: string) {
  const from = process.env.SMTP_FROM ?? "noreply@sib.com";
  await transporter.sendMail({
    from,
    to,
    subject: "Verify your email",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
}
