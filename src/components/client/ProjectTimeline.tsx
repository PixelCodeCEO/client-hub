import { Check, Circle } from 'lucide-react';

const stages = [
  { id: 'discovery', label: 'Discovery', description: 'Understanding your needs' },
  { id: 'design', label: 'Design', description: 'Creating mockups and prototypes' },
  { id: 'development', label: 'Development', description: 'Building your product' },
  { id: 'review', label: 'Review', description: 'Testing and refinement' },
  { id: 'delivered', label: 'Delivered', description: 'Project complete' },
];

interface ProjectTimelineProps {
  projectId: string;
  currentStatus: string;
}

export function ProjectTimeline({ currentStatus }: ProjectTimelineProps) {
  const currentIndex = stages.findIndex(s => s.id === currentStatus);

  return (
    <div className="relative">
      {/* Progress line - background */}
      <div className="absolute left-4 -translate-x-1/2 top-8 bottom-8 w-0.5 bg-border" />
      {/* Progress line - filled */}
      <div 
        className="absolute left-4 -translate-x-1/2 top-8 w-0.5 bg-primary transition-all duration-500"
        style={{ height: `${(currentIndex / (stages.length - 1)) * 100}%` }}
      />

      <div className="space-y-6">
        {stages.map((stage, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={stage.id} className="flex items-start gap-4 relative">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                  isComplete 
                    ? 'bg-primary text-primary-foreground' 
                    : isCurrent 
                      ? 'bg-primary/20 border-2 border-primary text-primary ring-4 ring-primary/20' 
                      : 'bg-secondary border-2 border-border text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <div className="relative">
                    <Circle className="h-3 w-3 fill-primary" />
                    <div className="absolute inset-0 animate-ping">
                      <Circle className="h-3 w-3 text-primary opacity-75" />
                    </div>
                  </div>
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <div className={`flex-1 pb-4 ${isPending ? 'opacity-50' : ''}`}>
                <h4 className={`font-medium ${isCurrent ? 'text-primary' : isComplete ? 'text-foreground' : ''}`}>
                  {stage.label}
                </h4>
                <p className="text-sm text-muted-foreground">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
