const GITHUB_API_BASE_URL = 'https://api.github.com/repos'
const isGitHubPullRequestPage = () => /.*github.com\/.*\/pull\/.*/.test(window.location.href)
const isGitHubComparePage = () => /.*github.com\/.*\/compare\/.*/.test(window.location.href)

async function fetchFilesFromGithub() {
  let GITHUB_API_TOKEN

  try {
    // Recupera il token da chrome.storage.sync
    const storageData = await new Promise((resolve) => {
      chrome.storage.sync.get({ githubAccessToken: '' }, (data) => {
        resolve(data)
      })
    })

    GITHUB_API_TOKEN = (storageData as { githubAccessToken: string }).githubAccessToken
  }
  catch (error) {
    console.error('Error retrieving token from storage:', error)
    return []
  }

  // Ottieni il token dalla variabile GITHUB_ACCESS_TOKEN
  if (!GITHUB_API_TOKEN) {
    console.error('GitHub Access Token not found.')
    return []
  }

  if (isGitHubPullRequestPage()) {
    // Url example: https://github.com/Teygeta/github-pr-extension/pull/1
    const prNumber = window.location.href.split('pull/')[1].split('/')[0]
    const repoPath = window.location.href.split('github.com/')[1].split('/pull')[0]

    try {
      const response = await fetch(`${GITHUB_API_BASE_URL}/${repoPath}/pulls/${prNumber}/files`, {
        headers: {
          Authorization: `token ${GITHUB_API_TOKEN}`,
        },
      })

      const data = await response.json()

      return data
    }
    catch (error) {
      console.error('Error fetching files from GitHub:', error)
      return []
    }
  }
  else if (isGitHubComparePage()) {
    // Url example: https://github.com/Teygeta/github-pr-extension/compare/main...dev-test-pr
    const repoPath = window.location.href.split('github.com/')[1].split('/compare')[0]
    const baseBranch = window.location.href.split('compare/')[1].split('...')[0]
    const headBranch = window.location.href.split('compare/')[1].split('...')[1]

    try {
      const response = await fetch(`${GITHUB_API_BASE_URL}/${repoPath}/compare/${baseBranch}...${headBranch}`, {
        headers: {
          Authorization: `token ${GITHUB_API_TOKEN}`,
        },
      })

      const data = await response.json()

      return data.files
    }
    catch (error) {
      console.error('Error fetching files from GitHub:', error)
      return []
    }
  }

  return []
}

// Logic for generate prompt for AI
async function generatePrompt() {
  const files = await fetchFilesFromGithub()
  let prompt = ''

  await Promise.all(files.map(async ({ filename, patch }: any) => {
    const patchText = filename.includes('pnpm-lock.yaml') ? 'A long packages changes' : patch
    prompt += `File: ${filename}\n\n---START PATCH---\nPatch: ${patchText}\n---END PATCH---\n\n`
  }))
  const promptInstructions = `
    Write a title for the changes in max 20 words.
    
    Rules for the title:
    - The title should be descriptive and concise, for a github pull request title.
    - This is not a description of the PR, but a title.
    - Don't include the file name in the title.
    - The title should be in present tense.
    - Don't use symbols, only words. (* & ^ % $ # @ ! etc.)
  `
  return prompt + promptInstructions
}

// Create AI button
const aiMagicButton = document.createElement('button')
Object.assign(aiMagicButton, {
  textContent: 'AI',
  className: 'Button Button--secondary Button--medium',
  style: 'border: 1px solid #4593F8; color: #4593F8; margin:0 4px;',
  type: 'button',
  onclick: getOutput,
})

async function getTitleOutput() {
  const prompt = await generatePrompt()
  aiMagicButton.textContent = 'AI generating...'

  let GOOGLE_GEMINI_API_KEY

  try {
    const storageData = await new Promise((resolve) => {
      chrome.storage.sync.get({ geminiAPIKey: '' }, (data) => {
        resolve(data)
      })
    })

    GOOGLE_GEMINI_API_KEY = (storageData as { geminiAPIKey: string }).geminiAPIKey
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
  finally {
    aiMagicButton.textContent = 'AI'
  }
}

async function getOutput() {
  const titleInputId = isGitHubComparePage() ? 'pull_request_title' : 'issue_title'
  const titleInput = document.getElementById(titleInputId)

  if (titleInput instanceof HTMLInputElement) {
    titleInput.value = await getTitleOutput()
  }
}

// Observer for detecting when the PR page is loaded
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      const aiButtonParentContainer = document.createElement('div')
      Object.assign(aiButtonParentContainer, {
        style: 'display: flex; align-items: center; width: 100%;',
      })

      const containerId = isGitHubPullRequestPage() ? 'issue_title' : 'pull_request_title'
      const targetElement = document.getElementById(containerId)

      if (targetElement) {
        targetElement.parentNode?.insertBefore(aiButtonParentContainer, targetElement)
        aiButtonParentContainer.appendChild(targetElement)
        aiButtonParentContainer.appendChild(aiMagicButton)
        observer.disconnect()
      }
    }
  })
})

observer.observe(document.body, { childList: true, subtree: true })
