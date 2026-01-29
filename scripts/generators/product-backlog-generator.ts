import { ScrumData } from '../types';

export function generateProductBacklog(scrumData: ScrumData): string {
  // Clean feature names for Gantt chart
  const cleanFeatureName = (name: string): string => {
    return name
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/:/g, ' -') // Replace colons
      .replace(/\(/g, '[') // Replace parentheses
      .replace(/\)/g, ']')
      .replace(/\[/g, '') // Remove brackets entirely
      .replace(/\]/g, '')
      .substring(0, 50); // Limit length
  };

  return `gantt
    title Product Backlog & Sprint Planning
    dateFormat YYYY-MM-DD
    
    ${scrumData.epics
      .map(
        (epic, epicIdx) => `
    section ${epic.name}
    ${epic.features
      .map((feature, featureIdx) => {
        const cleanName = cleanFeatureName(feature);
        const sprintForFeature = scrumData.sprints.find((s) =>
          s.tasks.some((t) => t.includes(feature.split(' ')[0]))
        );

        if (sprintForFeature) {
          const status =
            sprintForFeature.status === 'done'
              ? 'done'
              : sprintForFeature.status === 'active'
                ? 'active'
                : '';
          return `${cleanName} :${status}, ${sprintForFeature.startDate}, ${calculateDuration(sprintForFeature.startDate, sprintForFeature.endDate)}d`;
        } else {
          const futureDate = new Date('2026-02-01');
          futureDate.setDate(futureDate.getDate() + epicIdx * 14 + featureIdx * 3);
          return `${cleanName} :${futureDate.toISOString().split('T')[0]}, 3d`;
        }
      })
      .join('\n    ')}
    `
      )
      .join('\n')}
`;
}

function calculateDuration(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}
