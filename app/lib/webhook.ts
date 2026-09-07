import { WEBHOOK_CONFIG } from "@/config"

export type WebhookType = "custom" | "wecom" | "dingtalk"

export interface EmailMessage {
  emailId: string
  messageId: string
  fromAddress: string
  subject: string
  content: string
  html: string
  receivedAt: string
  toAddress: string
}

export interface WebhookPayload {
  event: typeof WEBHOOK_CONFIG.EVENTS[keyof typeof WEBHOOK_CONFIG.EVENTS]
  data: EmailMessage
}

/**
 * 格式化为企业微信机器人消息（markdown 格式）
 */
function formatWecom(data: EmailMessage): object {
  const preview = data.content.slice(0, 200).replace(/\n+/g, " ")
  return {
    msgtype: "markdown",
    markdown: {
      content: [
        `## 📬 收到新邮件`,
        `**收件地址：** ${data.toAddress}`,
        `**发件人：** ${data.fromAddress}`,
        `**主题：** ${data.subject}`,
        `**时间：** ${new Date(data.receivedAt).toLocaleString("zh-CN")}`,
        `**内容预览：**`,
        `> ${preview}${data.content.length > 200 ? "..." : ""}`,
      ].join("\n"),
    },
  }
}

/**
 * 格式化为钉钉机器人消息（markdown 格式）
 */
function formatDingtalk(data: EmailMessage): object {
  const preview = data.content.slice(0, 200).replace(/\n+/g, " ")
  return {
    msgtype: "markdown",
    markdown: {
      title: `新邮件：${data.subject}`,
      text: [
        `## 📬 收到新邮件`,
        `**收件地址：** ${data.toAddress}`,
        `**发件人：** ${data.fromAddress}`,
        `**主题：** ${data.subject}`,
        `**时间：** ${new Date(data.receivedAt).toLocaleString("zh-CN")}`,
        `**内容预览：**`,
        `> ${preview}${data.content.length > 200 ? "..." : ""}`,
      ].join("\n\n"),
    },
    at: {
      isAtAll: false,
    },
  }
}

/**
 * 根据 webhook 类型构建请求 body 和 headers
 */
function buildRequest(
  type: WebhookType,
  payload: WebhookPayload
): { body: string; headers: Record<string, string> } {
  const baseHeaders = { "Content-Type": "application/json" }

  switch (type) {
    case "wecom":
      return {
        body: JSON.stringify(formatWecom(payload.data)),
        headers: baseHeaders,
      }
    case "dingtalk":
      return {
        body: JSON.stringify(formatDingtalk(payload.data)),
        headers: baseHeaders,
      }
    case "custom":
    default:
      return {
        body: JSON.stringify(payload.data),
        headers: {
          ...baseHeaders,
          "X-Webhook-Event": payload.event,
        },
      }
  }
}

export async function callWebhook(
  url: string,
  payload: WebhookPayload,
  type: WebhookType = "custom"
) {
  let lastError: Error | null = null

  for (let i = 0; i < WEBHOOK_CONFIG.MAX_RETRIES; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.TIMEOUT)

      const { body, headers } = buildRequest(type, payload)

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return true
      }

      lastError = new Error(`HTTP error! status: ${response.status}`)
    } catch (error) {
      lastError = error as Error

      if (i < WEBHOOK_CONFIG.MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, WEBHOOK_CONFIG.RETRY_DELAY))
      }
    }
  }

  throw lastError
}
