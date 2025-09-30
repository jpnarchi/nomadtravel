import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ParsedAttachment, ParsedTextWithAttachments } from "./interfaces";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCreationTime(creationTime: number) {
  const date = new Date(creationTime)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function parseAttachmentsFromText(text: string): ParsedTextWithAttachments {
  const files = text.match(/<attachment>[\s\S]*?<\/attachment>/g)?.map(attachment => {
    const url = attachment.match(/<url>(.*?)<\/url>/)?.[1];
    const type = attachment.match(/<type>(.*?)<\/type>/)?.[1];
    return { url, type };
  }).filter((file): file is ParsedAttachment =>
    file.url !== undefined && file.type !== undefined
  ) || [];

  // Remove attachment tags from the text if files exist
  const displayText = files.length > 0
    ? text.replace(/<attachment>[\s\S]*?<\/attachment>/g, '').trim()
    : text;

  return { files, displayText };
}

export function formatAttachmentsForPrompt(attachments: ParsedAttachment[]): string {
  return attachments.map(file =>
    `<attachment>\n<url>${file.url}</url>\n<type>${file.type}</type>\n</attachment>`
  ).join("\n");
}

export function createPromptWithAttachments(input: string, attachments: ParsedAttachment[]): string {
  if (attachments.length === 0) {
    return input;
  }

  const attachmentText = formatAttachmentsForPrompt(attachments);
  return input + "\n\n" + attachmentText;
}
