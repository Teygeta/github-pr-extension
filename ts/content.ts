const titleInput = document.querySelector('.form-control.js-quick-submit')
const editSaveButtonsContentainer = document.querySelector('.js-issue-update.js-comment')

const aiMagicButton = document.createElement('button')
aiMagicButton.innerText = 'AI'
aiMagicButton.classList.add('Button--secondary', 'Button--medium', 'Button')
aiMagicButton.setAttribute('type', 'button')

document.addEventListener('click', (event) => {
  if(editSaveButtonsContentainer) {
    editSaveButtonsContentainer.appendChild(aiMagicButton)

    if(event.target === aiMagicButton) {

      if(titleInput instanceof HTMLInputElement) {
        // logic for get output
        let output = 'Magic AI Output'
        titleInput.value = output
      }
    }
  }
})
