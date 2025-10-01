export interface ParsedAttachment {
    url: string;
    type: string;
}

export interface ParsedTextWithAttachments {
    files: ParsedAttachment[];
    displayText: string;
}