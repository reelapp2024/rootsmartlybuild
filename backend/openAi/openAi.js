const axios = require('axios');



const getSubcategoriesFromOpenAI = async (prompt) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error('API key missing');

  try {
    const { data } = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    }, {
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      timeout: 60000,        // ── add this line
    });

    const responseText = data.choices[0].message.content.trim();
    const parsedResponse = JSON.parse(responseText);

    // Validate the response structure
    if (!Array.isArray(parsedResponse) || !parsedResponse.every(item => item.service_title && item.subcategory_description && item.contact_phone)) {
      throw new Error('Invalid response structure');
    }

    return parsedResponse;
  } catch (error) {
    throw new Error(`Error fetching subcategories: ${error.message}`);
  }
};


const MODEL_PRICING = {
  'gpt-3.5-turbo': { input: 0.00000050, output: 0.00000150 },  // $0.50 / $1.50 per million
  'gpt-4': { input: 0.00003000, output: 0.00006000 },  // $30 / $60 per million
  'gpt-4-0613': { input: 0.00003000, output: 0.00006000 },
  'gpt-4-1106-preview': { input: 0.00000200, output: 0.00000800 },  // $2 / $8 per million
  'gpt-4.1': { input: 0.00000200, output: 0.00000800 },
  'gpt-4.1-mini': { input: 0.00000040, output: 0.00000160 },  // $0.40 / $1.60 per million
  'gpt-4o': { input: 0.00000250, output: 0.00001000 },  // $2.50 / $10 per million
  'gpt-4o-mini': { input: 0.00000015, output: 0.00000060 },  // $0.15 / $0.60 per million
};

const getResponseFromOpenAI = async (prompt, model = 'gpt-3.5-turbo') => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) throw new Error('API key missing');

  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo'];

  const { data } = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000,
    }
  );

  // console.log(data, "data value from open ai funtion")

  // extract text & usage
  const responseText = data.choices[0].message.content.trim();
  const usage = data.usage || {};
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (inputTokens + outputTokens);

  // optional cost calc
  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;
  const totalCost = inputCost + outputCost;

  // return everything
  return {
    text: responseText,
    modelName: model,
    inputTokens,
    outputTokens,
    totalTokens,
    cost: totalCost
  };
};

module.exports = { getSubcategoriesFromOpenAI, getResponseFromOpenAI };

