import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Building, Users, Target, Palette, Code, Globe, Image } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProjectSummaryData } from '@/lib/interfaces';

interface ProjectSummaryProps {
    data: ProjectSummaryData;
}

export const ProjectSummary: React.FC<ProjectSummaryProps> = ({ data }) => {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">{data.businessName}</h1>
                <p className="text-lg text-muted-foreground">Platform Requirements Summary</p>
            </div>

            {/* Limitations Alert */}
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>Platform Limitations:</strong>
                    <ul className="mt-2 space-y-1">
                        {data.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start gap-1">
                                <span className="text-xs mt-1">•</span>
                                <span className="text-sm">{limitation}</span>
                            </li>
                        ))}
                    </ul>
                </AlertDescription>
            </Alert>

            {/* Main Info Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Business Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Business Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Type</h4>
                            <Badge variant="secondary">{data.businessType}</Badge>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Industry</h4>
                            <p className="text-sm">{data.industry}</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Purpose</h4>
                            <p className="text-sm">{data.platformPurpose}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Target Audience */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Target Audience
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm">{data.targetAudience}</p>
                        {data.competition && (
                            <div className="mt-4">
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Competition & Inspiration</h4>
                                <p className="text-sm text-muted-foreground">{data.competition}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Features */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Key Features
                    </CardTitle>
                    <CardDescription>Core functionality to be implemented</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {data.keyFeatures.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Design & Technical Requirements */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Design Style */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Design Style
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="secondary" className="text-sm">
                            {data.designStyle}
                        </Badge>
                        {data.imageRequirements && (
                            <div className="mt-4">
                                <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                                    <Image className="h-4 w-4" />
                                    Image Requirements
                                </h4>
                                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                    {data.imageRequirements}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Technical Requirements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5" />
                            Technical Requirements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.technicalRequirements.map((req, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                    <span className="text-sm">{req}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Structure */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Platform Structure
                    </CardTitle>
                    <CardDescription>Pages and sections to be created</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.contentStructure.map((section, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                {section}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200">Ready to Build</CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-400">
                        Your platform requirements are now clearly defined. The development process can begin with these specifications.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};