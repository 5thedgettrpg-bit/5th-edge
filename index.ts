import { generateText } from 'ai';

async function main() {
  const { text } = await generateText({
    model: 'moonshotai/kimi-k3',
    prompt: 'Invent a new holiday and describe its traditions.',
  });

  console.log(text);
}

main().catch((error) => {
  console.error('AI Gateway example failed:', error);
  process.exitCode = 1;
});
