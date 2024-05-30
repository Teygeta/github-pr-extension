async function getToken(key: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getToken', key }, (response) => {
      if (response.success) {
        resolve(response.token)
      }
      else {
        reject(new Error(`Token not found for key: ${key}`))
      }
    })
  })
}

export async function getTitleOutput(prompt: string) {
  let GOOGLE_GEMINI_API_KEY

  try {
    GOOGLE_GEMINI_API_KEY = await getToken('aiApiKey')
    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('Gemini API key not found.')
      return []
    }
  }
  catch (error) {
    console.error('Error retrieving token from storage:', error)
    return []
  }

  if (!GOOGLE_GEMINI_API_KEY) {
    console.error('Gemini API key not found.')
    return []
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    })

    if (!response.ok) {
      throw new Error('AI failed to generate title')
    }

    const { candidates } = await response.json()
    return candidates[0]?.content.parts[0]?.text || 'Error: AI failed to generate title'
  }
  catch (error) {
    // TODO: error handling
    return 'Error: AI failed to generate title'
  }
}
