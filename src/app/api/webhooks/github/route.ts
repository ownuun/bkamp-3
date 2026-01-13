import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  handlePushEvent,
  handlePullRequestEvent,
  handlePullRequestReviewEvent,
  handleIssuesEvent,
} from "@/lib/github/webhook-handlers";

// Verify GitHub webhook signature
function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  // Get headers
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");
  const deliveryId = request.headers.get("x-github-delivery");

  // Get raw payload for signature verification
  const payload = await request.text();

  // Verify signature if secret is configured
  if (secret) {
    if (!verifySignature(payload, signature, secret)) {
      console.error(`[Webhook] Invalid signature for delivery ${deliveryId}`);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  }

  // Parse payload
  let data;
  try {
    data = JSON.parse(payload);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  console.log(`[Webhook] Received ${event} event (delivery: ${deliveryId})`);

  try {
    let result;

    switch (event) {
      case "push":
        result = await handlePushEvent(data);
        break;

      case "pull_request":
        result = await handlePullRequestEvent(data);
        break;

      case "pull_request_review":
        result = await handlePullRequestReviewEvent(data);
        break;

      case "issues":
        result = await handleIssuesEvent(data);
        break;

      case "ping":
        // GitHub sends a ping event when webhook is first configured
        console.log(`[Webhook] Ping received from ${data.repository?.full_name || "unknown"}`);
        return NextResponse.json({
          message: "Pong! Webhook configured successfully.",
        });

      default:
        console.log(`[Webhook] Ignoring unsupported event: ${event}`);
        return NextResponse.json({
          message: `Event ${event} is not handled`,
        });
    }

    console.log(`[Webhook] Successfully processed ${event} event`);
    return NextResponse.json({
      success: true,
      event,
      result,
    });
  } catch (error) {
    console.error(`[Webhook] Error processing ${event}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "GitHub webhook endpoint is ready",
    supportedEvents: ["push", "pull_request", "pull_request_review", "issues"],
  });
}
