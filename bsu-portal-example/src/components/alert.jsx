import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react"

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"

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
        <div className="grid w-full max-w-xl items-start gap-2">
            {sortedContent.map((item, index) => (
                <Alert key={index} variant={item.is_critical ? "destructive" : "default"}>
                    <AlertCircleIcon />
                    <AlertTitle>{item.alert_title}</AlertTitle>
                    <AlertDescription>
                        {item.alert_description}
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    )
}
