export interface ParsedAttachment {
    url: string;
    type: string;
}

export interface ParsedTextWithAttachments {
    files: ParsedAttachment[];
    displayText: string;
}

export interface DbProject {
    id: string;
    name: string;
    status: string;
    region: string;
    created_at: string;
    database: {
        host: string;
        version: string;
        postgres_engine: string;
        release_channel: string;
    };
    organization_id: string;
}