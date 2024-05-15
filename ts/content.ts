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

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json()

    return data
  } catch (error) {
    console.error(error)
    return []
  }
}

async function getTitleOutput() {
  let output = 'Magic AI Title'
  const files = await fetchFiles()
  console.log(files)

  return output
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
        titleInput.value = output
      }
    }
  }
})