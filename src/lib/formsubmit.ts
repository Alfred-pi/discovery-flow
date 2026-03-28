// FormSubmit.co — free email forwarding, no account needed
// Submissions go to alfred.pi.assistant@gmail.com
const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/alfred.pi.assistant@gmail.com';

export async function submitForm(data: {
  answers: Record<string, any>;
  language: string;
  code: string;
  client: string;
}) {
  // Format answers into readable text
  const lines: string[] = [];
  lines.push(`Code: ${data.code}`);
  lines.push(`Client: ${data.client}`);
  lines.push(`Language: ${data.language}`);
  lines.push(`Date: ${new Date().toLocaleString('fr-CH')}`);
  lines.push('---');

  for (const [key, value] of Object.entries(data.answers)) {
    if (typeof value === 'object' && value !== null) {
      if (value.value && Array.isArray(value.value)) {
        lines.push(`${key}: ${value.value.join(', ')}`);
      }
      if (value.details) {
        lines.push(`  Details: ${value.details}`);
      }
    } else if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        lines.push(`${key}: ${JSON.stringify(parsed, null, 2)}`);
      } catch {
        lines.push(`${key}: ${value}`);
      }
    }
  }

  const response = await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      _subject: `Discovery Flow — ${data.client || data.code}`,
      _template: 'box',
      message: lines.join('\n'),
      name: data.client || 'Unknown',
      code: data.code,
      language: data.language,
    }),
  });

  if (!response.ok) {
    throw new Error('Submission failed');
  }

  return response.json();
}
