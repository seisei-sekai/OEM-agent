import { ApplicationData } from '../types';

export function generateUseCaseCatalog(applicationData: ApplicationData): string {
  // Group use cases by category
  const grouped: { [key: string]: string[] } = {};

  for (const uc of applicationData.useCases) {
    let category = 'General';

    if (uc.name.includes('Chat') || uc.name.includes('Message') || uc.name.includes('Session')) {
      category = 'Conversation Management';
    } else if (uc.name.includes('Branding') || uc.name.includes('Extract')) {
      category = 'Branding';
    } else if (uc.name.includes('Product') || uc.name.includes('Recommend') || uc.name.includes('Mockup')) {
      category = 'Product Recommendation';
    }

    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(uc.name);
  }

  return `mindmap
  root((Use Cases<br/>用例目录))
    ${Object.entries(grouped)
      .map(
        ([category, useCases]) => `
    ${category}
      ${useCases
        .map((uc) => {
          // Extract main method names
          const methods = uc.replace('UseCase', '').split(/(?=[A-Z])/).join(' ');
          return `${uc}\n        ${methods}`;
        })
        .join('\n      ')}
    `
      )
      .join('\n')}
`;
}
