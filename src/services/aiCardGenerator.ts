import OpenAI from "openai";

export interface AICard {
  front: string;
  back: string;
  card_type: string;
  difficulty: number;
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCardsFromSource(
  text: string,
  count: number,
  difficulty: number
): Promise<AICard[]> {
  const prompt = `Generate ${count} flashcards from the following text.\nEach card should be an object with front, back, and card_type (like multiple_choice, fill_in_the_blank, true_false, short_answer).\nReturn JSON array.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an assistant that creates educational flashcards." },
      { role: "user", content: `${prompt}\n\nText:\n${text}` },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "[]";
  let cards: AICard[] = [];
  try {
    cards = JSON.parse(content) as AICard[];
  } catch {
    throw new Error("Failed to parse AI response");
  }

  return cards.map((card) => ({
    front: card.front,
    back: card.back,
    card_type: card.card_type,
    difficulty,
  }));
}

