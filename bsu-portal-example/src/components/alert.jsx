import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react"

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Card } from "@/components/ui/card";

export function AlertDemo({ content }) {
   const now = new Date();

    const filteredContent = content.filter((item) => {
        const startTime = item.start_time ? new Date(item.start_time) : null;
        const endDate = item.end_date ? new Date(item.end_date) : null;

        // Show alerts if they are null or the start_time is now/past and before end_date
        return (
            (startTime === null && endDate === null) || 
            (startTime <= now && (endDate === null || now < endDate))
        );
    });

     const sortedContent = filteredContent.sort((a, b) => {
        return (b.is_critical ? 1 : 0) - (a.is_critical ? 1 : 0);
    });

    return (
        <Card className="flex flex-col p-6 mt-4 mb-4 max-h-[98%] overflow-y-auto">
            <div className="mt-4 flex-1 max-h-[98%] overflow-y-auto">
                {sortedContent.map((item, index) => (
                    <Alert key={index} variant={item.is_critical ? "destructive" : "default"} className="mb-2"> {/* Padding for alerts */}
                        <AlertCircleIcon />
                        <AlertTitle>{item.alert_title}</AlertTitle>
                        <AlertDescription>
                            {item.alert_description}
                        </AlertDescription>
                    </Alert>
                ))}
            </div>
        </Card>
    );
}
