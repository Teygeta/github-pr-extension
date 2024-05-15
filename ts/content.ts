import { GoogleGenerativeAI } from "@google/generative-ai"

const isGitHubPullRequestPage = () => /.*github.com\/.*\/pull\/.*/.test(window.location.href)

const titleInput = document.querySelector('.form-control.js-quick-submit')
const editPRButtonsContainer = document.querySelector('.js-issue-update.js-comment')

const aiMagicButton = document.createElement('button')
aiMagicButton.innerText = 'AI'
aiMagicButton.classList.add('Button', 'Button--secondary', 'Button--medium')
aiMagicButton.style.border = '1px solid #4593F8'
aiMagicButton.style.color = '#4593F8'
aiMagicButton.setAttribute('type', 'button')

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
  } catch (error) {
    console.error(error)
    return []
  }
}

async function getTitleOutput() {
  const files = await fetchFiles()
  console.log(files)

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest"})

  const prompt = `
  Write a sentence that is at least 5 words long and no more than 12 words long, describing changes for a GitHub pull request.
  This sentence must start with one of the following words: "chore", "docs", "feat", "fix", "refactor", "style", "test".
  Do not use colons.
  Do not use commas.
  Do not use punctuation marks.
  Do not use offensive or inappropriate words.
  Use technical and specific terms for a code development context.
  `
  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
  
    if (text) {
      return text 
    }
  } catch (error) {
    // if(error instanceof GoogleGenerativeAIFetchError) {
    //     console.error('API rate limit exceeded')
    //   }
    // }
  }
}

document.addEventListener('click', async (event) => {
  if (!isGitHubPullRequestPage()) {
    return
  }

  if (editPRButtonsContainer) {
    editPRButtonsContainer.appendChild(aiMagicButton)
    if (event.target === aiMagicButton) {
      if (titleInput instanceof HTMLInputElement) {
        const output = await getTitleOutput()
        titleInput.value = output || ''
      }
    }
  }
})
