const saveButton = document.getElementById('save')
const saveStatus = document.getElementById('save-status')
saveButton.addEventListener('click', saveOptions)

function saveOptions() {
  const githubAccessToken = document.getElementById('github-access-token')
  const geminiAPIKey = document.getElementById('gemini-api-key')

  chrome.storage.sync.set(
    {
      githubAccessToken: githubAccessToken.value,
      geminiAPIKey: geminiAPIKey.value,
    },
    async () => {
      try {
        saveButton.setAttribute('disabled', true)

        await restoreOptions()

        saveStatus.textContent = 'Saved!'
        setTimeout(() => {
          saveStatus.textContent = ''
          saveButton.removeAttribute('disabled')
        }, 1000)
      }
      catch (error) {
        saveStatus.textContent = error.message
      }
    },
  )
}

async function restoreOptions() {
  chrome.storage.sync.get(
    {
      githubAccessToken: '',
      geminiAPIKey: '',
    },
    async ({ githubAccessToken, geminiAPIKey }) => {
      document.getElementById('github-access-token').value = githubAccessToken
      document.getElementById('gemini-api-key').value = geminiAPIKey

      await verifyGithubAccessToken(githubAccessToken)
    },
  )
}

async function verifyGithubAccessToken(accessToken) {
  const projectAccessScope = document.getElementById('check-project-access-scope')
  const repoAccessScope = document.getElementById('check-repo-access-scope')

  const res = await fetch('https://api.github.com', {
    method: 'GET',
    headers: {
      Authorization: `token ${accessToken}`,
    },
  })

  if (!res.ok) {
    projectAccessScope.textContent = 'invalid'
    repoAccessScope.textContent = 'invalid'
    projectAccessScope.style.color = 'red'
    repoAccessScope.style.color = 'red'
    return
  }

  const scopes = res.headers.get('X-OAuth-Scopes').split(', ')

  projectAccessScope.textContent = scopes.includes('read:project') ? 'valid' : 'invalid'
  repoAccessScope.textContent = scopes.includes('repo') ? 'valid' : 'invalid'
  projectAccessScope.style.color = scopes.includes('read:project') ? 'green' : 'red'
  repoAccessScope.style.color = scopes.includes('repo') ? 'green' : 'invalid'
}

document.addEventListener('DOMContentLoaded', restoreOptions)
