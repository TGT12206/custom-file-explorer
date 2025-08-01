import { CFEFile } from "./cfe-file";
import { CFEFileHandler } from "./cfe-file-handler";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";

/**
 * A child class of the CFEFile class. Represents a folder within the SourceFolder.
 */
export class Folder extends CFEFile {
	/**
	 * The IDs of files contained in this folder
	 */
	containedFileIDs: number[];

	/**
	 * @override Folder layer:
	 * 
	 * initializes the contained file ids array for the folder object
	 */
	static override async CreateNewFileForLayer(snv: SourceAndVault, fileType: string, parentFolderID: number, name: string): Promise<Folder> {
		const unfinishedFolder = <Folder> (await super.CreateNewFileForLayer(snv, fileType, parentFolderID, name));
		unfinishedFolder.containedFileIDs = [];
		return unfinishedFolder;
	}

	override async Display(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		await super.Display(snv, mainDiv);
		const createButtonsDiv = mainDiv.createDiv('hbox');
		const newFileButton = createButtonsDiv.createEl('button', { text: 'Create New File' } );
		const popUpContainer = mainDiv.createDiv();
		newFileButton.onclick = () => {
			this.LoadCreateFileUI(snv, mainDiv, popUpContainer);
		}
		const mediaFilesButton = createButtonsDiv.createEl('button', { text: 'Upload Multiple Images / Videos' } );
		mediaFilesButton.onclick = () => {
			this.LoadFileSelectionUI(snv, mainDiv, popUpContainer);
		}
		const folderDisplayContainer = mainDiv.createDiv('cfe-grid');
		for (let i = 0; i < this.containedFileIDs.length; i++) {
			const containedFile = await CFEFileHandler.LoadFile(snv, this.containedFileIDs[i]);
			if (containedFile !== null) {
				await containedFile.DisplayThumbnail(snv, folderDisplayContainer.createDiv(), mainDiv);
			}
		}
	}
	
	private LoadCreateFileUI(snv: SourceAndVault, mainDiv: HTMLDivElement, div: HTMLDivElement) {
		div.empty();
		const popupDiv = div.createDiv('cfe-popup');
		const wrapperDiv = popupDiv.createDiv();
		wrapperDiv.style.position = 'relative';
		const exitButton = wrapperDiv.createEl('button', { text: 'X', cls: 'cfe-remove-button' } );
		exitButton.style.position = 'absolute';
		exitButton.style.top = '0%';
		exitButton.style.right = '0%';
		
		popupDiv.createEl('p', { text: 'Choose a File Type to create:' } );
		const fileTypeDropdown = popupDiv.createEl('select');
		popupDiv.createEl('p', { text: 'File Name:' } );
		const nameInput = popupDiv.createEl('input', { type: 'text', value: 'Unnamed' } );
		popupDiv.createEl('p', { text: 'Parent Folder ID:' } );
		const parentFolderIDInput = popupDiv.createEl('input', { type: 'text', value: '' + this.id } );
		for (let i = 0; i < CFEFileHandler.KnownFileTypes.length; i++) {
			const option = fileTypeDropdown.createEl('option');
			option.value = CFEFileHandler.KnownFileTypes[i];
			option.text = CFEFileHandler.KnownFileTypes[i];
			fileTypeDropdown.options.add(option);
		}

		const submitButton = popupDiv.createEl('button', { text: 'Create' } );

		const onExit = () => {
			popupDiv.remove();
		}
		const onSubmit = async () => {
			await CFEFileHandler.CreateNew(snv, fileTypeDropdown.value, parseInt(parentFolderIDInput.value), nameInput.value);
			exitButton.click();
			const resettedFolder = await CFEFileHandler.LoadFile(snv, this.id);
			await resettedFolder.Display(snv, mainDiv);
		}
		exitButton.onclick = onExit;
		submitButton.onclick = onSubmit;

		popupDiv.onkeydown = async (event) => {
			if (event.key === 'Escape') {
				onExit();
			} else if (event.key === 'Enter') {
				await onSubmit();
			}
		}
	}

	private LoadFileSelectionUI(snv: SourceAndVault, mainDiv: HTMLDivElement, div: HTMLDivElement) {
		div.empty();
		const popupDiv = div.createDiv('cfe-popup');
		const wrapperDiv = popupDiv.createDiv();
		wrapperDiv.style.position = 'relative';
		popupDiv.createEl('p', { text: 'Choose your files' } );
		const fileInput = popupDiv.createEl('input', { type: 'file' } );
		fileInput.multiple = true;
		popupDiv.createEl('p', { text: 'Parent Folder ID: ' } );
		const parentFolderIDInput = popupDiv.createEl('input', { type: 'text', value: '' + this.id } );
		const exitButton = wrapperDiv.createEl('button', { text: 'X', cls: 'cfe-remove-button' } );
		exitButton.style.position = 'absolute';
		exitButton.style.top = '0%';
		exitButton.style.right = '0%';
		const submitButton = popupDiv.createEl('button', { text: 'Create' } );
		
		const onExit = () => {
			popupDiv.remove();
		}
		const onSubmit = async () => {
			const fileArray = fileInput.files;
			const parentFolderID = parseInt(parentFolderIDInput.value);
			if (fileArray !== null) {
				for (let i = 0; i < fileArray.length; i++) {
					const cfeFile = await CFEFileHandler.CreateNew(snv, 'Single Media File', parentFolderID, fileArray[i].name);
					const mediaFile = Object.assign(new SingleMediaFile(), cfeFile);
					await mediaFile.SetFileTo(snv, fileArray[i]);
					await mediaFile.Save(snv);
				}
				exitButton.click();
				const resettedFolder = await CFEFileHandler.LoadFile(snv, this.id);
				await resettedFolder.Display(snv, mainDiv);
			}
		}
		exitButton.onclick = onExit;
		submitButton.onclick = onSubmit;

		popupDiv.onkeydown = async (event) => {
			if (event.key === 'Escape') {
				onExit();
			} else if (event.key === 'Enter') {
				await onSubmit();
			}
		}
	}
}
