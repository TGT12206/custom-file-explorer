import { FormattedFile } from "./file-formats/formatted-file";
import { FormattedFileHandler } from "./file-formats/formatted-file-handler";
import { Source } from "./source";

/**
 * Represents and handles the pop up UI behind creating a file.
 */
export class FileCreatorUI {
	Source: Source;
	PopUpContainer: HTMLDivElement;
	InputFormContainer: HTMLDivElement;
	Dropdown: HTMLSelectElement;
	FileNameInput: HTMLInputElement;
	FileName() {
		return this.FileNameInput.value;
	}
	parentFolderIDInput: HTMLInputElement;
	parentFolderID() {
		return this.parentFolderIDInput.value;
	}
	SubmitButton: HTMLInputElement | HTMLButtonElement | HTMLDivElement;

	/**
	 * Warning! This constructor loads the UI asynchronously!
	 */
	constructor(popUpContainer: HTMLDivElement, source: Source) {
		popUpContainer.className = 'cfe-create-file-pop-up';
		this.PopUpContainer = popUpContainer;
		this.Source = source;
		const header = popUpContainer.createDiv('cfe-file-creator-header');
		header.createEl('p', { text: 'Choose a File Type to create: ' } );
		this.Dropdown = header.createEl('select');
		for (let i = 0; i < FormattedFile.KnownFileTypes.length; i++) {
			const option = this.Dropdown.createEl('option');
			option.value = FormattedFile.KnownFileTypes[i];
			option.text = FormattedFile.KnownFileTypes[i];
			this.Dropdown.options.add(option);
		}
		const exitButton = header.createEl('button', { text: 'X', cls: 'cfe-exit-button' } );
		exitButton.onclick = () => {
			popUpContainer.style.display = 'none';
		}
		this.InputFormContainer = this.PopUpContainer.createDiv('cfe-file-creator-input-form');
		this.SubmitButton = this.PopUpContainer.createEl('button', { text: 'Create' } );
		this.LoadUI();
	}
	private async LoadUI() {
		this.Dropdown.onchange = async () => {
			this.InputFormContainer.empty();
			const newForm = await FormattedFileHandler.DisplayCreationForm(this.InputFormContainer, this.Dropdown.value, this.Source);
			this.SubmitButton.onclick = newForm.OnSubmit;
		}
		const defaultForm = await FormattedFileHandler.DisplayCreationForm(this.InputFormContainer, this.Dropdown.value, this.Source);
		this.SubmitButton.onclick = defaultForm.OnSubmit;
	}

}
