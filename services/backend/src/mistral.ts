import MistralClient from "@mistralai/mistralai";

enum ResponseFormats {
  text = "text",
  json_object = "json_object",
}
console.log("mistral connect");
export const mistralClient = new MistralClient(process.env.MISTRAL_API_KEY);

export const createChatConfig = ({
  question,
  transcript,
}: {
  transcript: string;
  question: string;
}) => ({
  model: "open-mixtral-8x7b",
  responseFormat: {
    type: ResponseFormats.json_object,
  },
  temperature: 0.7,
  messages: [
    {
      role: "user",
      content: `
      Your task today will be given a user question and a lecture transcript:
      - Identify ALL the text in the transcript relevant to the lecture, don't miss any text. The text in the transcript may also be discontinuous
      - Provide an attempted answer to the question based on your knowledge

      Here is an example generation I expect:

      <transcript>
      Today was a lovely day. My dog
      was going crazy. This may be confusing,
      but the answer to the universe
      is 42.
      My wife was going crazy too
      </transcript>
      <question>What is the answer to also life, not just the universe?</question>

      {"kind": "found", "relevantTranscript": "This may be confusing, but the answer to the universe is 42.", "attemptedAnswer": "The answer to life also happens to be 42"}

      Here is an example error case I expect:
      <transcript>
      I just got a new iphone today
      yeah I know crazy, really nice phone
      doesn't sync with my android devices though
      </transcript>
      <question>Why does my dog shed so much</question>

      {"kind" : "not-found", "attemptedAnswer": "Excessive shedding in dogs can be caused by various factors including stress, poor diet, allergies, or medical conditions. It’s recommended to consult a veterinarian to determine the exact cause and appropriate treatment."}


      <transcript>${transcript}</transcript>
      <question>${question}</question>
      `,
    },
  ],
});
