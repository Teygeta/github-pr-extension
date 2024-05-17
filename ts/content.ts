// Logic for fetch files from current PR
async function fetchFiles() {
  // url example: https://github.com/Teygeta/github-pr-extension/pull/1
  const currentPrNumber = window.location.href.split('pull/')[1].split('/')[0]
  const repoPath = window.location.href.split('github.com/')[1].split('/pull')[0]

  const accessToken = process.env.GITHUB_ACCESS_TOKEN

  try {
    const response = await fetch(`https://api.github.com/repos/${repoPath}/pulls/${currentPrNumber}/files`, {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    })

    const data = await response.json()

    return data
  }
  catch (error) {
    console.error(error)
    return []
  }
}

// Logic for generate prompt for AI
async function getPrompt() {
  const files = await fetchFiles()
  let prompt = ''

  await Promise.all(files.map(async (file) => {
    const fileName = file.filename
    const filePatch = file.patch

    prompt += `File: ${fileName}\n\n`
    prompt += `
    ---START PATCH---
    Patch: ${fileName.includes('pnpm-lock.yaml') ? 'A long packeges changes' : filePatch}
    ---END PATCH---
    \n\n
    `
  }))

  const promptInstructions = `
    Write a title for the changes in max 20 words.
    
    Rules for the title:
    - The title should be descriptive and concise, for a github pull request title.
    - This is not a description of the PR, but a title.
    - Don't include the file name in the title.
    - The title should be in present tense.
    - Don't use characters, only words.
  `
  prompt += promptInstructions
  return prompt
}

// Create AI button
const aiMagicButton = document.createElement('button')
aiMagicButton.textContent = 'AI'
aiMagicButton.classList.add('Button', 'Button--secondary', 'Button--medium')
aiMagicButton.style.border = '1px solid #4593F8'
aiMagicButton.style.color = '#4593F8'
aiMagicButton.setAttribute('type', 'button')

// Logic for generate title using GoogleGenerativeAI
async function getTitleOutput() {
  const prompt = await getPrompt()

  try {
    aiMagicButton.textContent = 'AI generating...'

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('Error: AI failed to generate title')
    }

    const data = await response.json()

    const text = data.candidates[0].content.parts[0].text

    if (text) {
      aiMagicButton.textContent = 'AI'
      return text
    }
  }
  catch (error) {
    // TODO: error handling
    return 'Error: AI failed to generate title'
  }
  finally {
    aiMagicButton.textContent = 'AI'
  }
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      const editPRButtonsContainer = document.querySelector('.js-issue-update.js-comment')
      if (editPRButtonsContainer) {
        editPRButtonsContainer.appendChild(aiMagicButton)
        observer.disconnect()
      }
    }
  })
})
observer.observe(document.body, { childList: true, subtree: true })

document.addEventListener('click', async (event) => {
  if (event.target === aiMagicButton) {
    const titleInput = document.querySelector('.form-control.js-quick-submit')
    if (titleInput instanceof HTMLInputElement) {
      const output = await getTitleOutput()
      titleInput.value = output || ''
    }
  }
})
