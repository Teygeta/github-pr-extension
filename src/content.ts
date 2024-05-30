import { getTitleOutput, getToken } from './utils'

const GITHUB_API_BASE_URL = 'https://api.github.com/repos'
const isGitHubPullRequestPage = () => /.*github.com\/.*\/pull\/.*/.test(window.location.href)
const isGitHubComparePage = () => /.*github.com\/.*\/compare\/.*/.test(window.location.href)

async function fetchFilesFromGithub() {
  let GITHUB_API_TOKEN

  try {
    GITHUB_API_TOKEN = await getToken('githubAccessToken')
    if (!GITHUB_API_TOKEN) {
      console.error('GitHub Access Token not found.')
      return []
    }
  }
  catch (error) {
    console.error('Error retrieving token from storage:', error)
    return []
  }

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
    Write a title for the changes below in max 20 words.
    
    Rules for the title:
    - The title should be descriptive and concise, for a github pull request title.
    - This is not a description of the PR, but a title.
    - Don't include the file name in the title.
    - The title should be in present tense.
    - Don't use symbols, only words. (* & ^ % $ # @ ! etc.)

    The changes are:
  `
  return promptInstructions + prompt
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

async function getOutput() {
  const titleInputId = isGitHubComparePage() ? 'pull_request_title' : 'issue_title'
  const titleInput = document.getElementById(titleInputId)

  if (titleInput instanceof HTMLInputElement) {
    try {
      aiMagicButton.textContent = 'AI generating...'

      const GOOGLE_GEMINI_API_KEY = await getToken('aiApiKey')
      if (!GOOGLE_GEMINI_API_KEY) {
        console.error('Gemini API key not found.')
        return []
      }

      const prompt = await generatePrompt()
      titleInput.value = await getTitleOutput(prompt, GOOGLE_GEMINI_API_KEY)

      aiMagicButton.textContent = 'AI'
    }
    catch (error) {
      console.error('Error generating title:', error)
    }
    finally {
      aiMagicButton.textContent = 'AI'
    }
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
