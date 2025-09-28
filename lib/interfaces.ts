export interface ProjectSummaryData {
    businessName: string;
    businessType: string;
    industry: string;
    targetAudience: string;
    platformPurpose: string;
    keyFeatures: string[];
    designStyle: string;
    technicalRequirements: string[];
    competition?: string;
    contentStructure: string[];
    imageRequirements?: string;
    limitations: string[];
}

export interface ProjectSummaryResponse {
    type: string;
    data: ProjectSummaryData;
}