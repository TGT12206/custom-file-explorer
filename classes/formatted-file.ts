import { normalizePath, Notice, Vault } from "obsidian";

//#region Source
/**
 * A representation of the source (similar to a vault). Contains a reference to the vault path and file count.
 */
export class SourceFolder {
	vaultPath: string;
	fileCount: number;

	private constructor(vaultPath: string, fileCount: number) {
		this.vaultPath = vaultPath;
		this.fileCount = fileCount;
	}

	static async CreateOrLoadSourceFolder(vaultPath: string, vault: Vault, container: HTMLDivElement): Promise<SourceFolder> {
		vaultPath = vaultPath.endsWith('/source.json') ? vaultPath.slice(0, -12) : vaultPath;
		const exists = vault.getFileByPath(vaultPath + '/source.json') !== null;
		let newSourceFolder: SourceFolder;
		if (exists) {
			newSourceFolder = await this.LoadExistingSource(vaultPath, vault, container);
		} else {
			newSourceFolder = await this.CreateNewSourceFolder(vaultPath, vault, container);
		}
		const rootFolder = await Folder.LoadOrCreateRootFolder(newSourceFolder, vault);
		const sourceAndVault = new SourceAndVault(newSourceFolder, vault);
		await SourceFolder.Save(sourceAndVault);
		await FormattedFileHandler.SaveFile(sourceAndVault, rootFolder);
		await FormattedFileHandler.Display(sourceAndVault, rootFolder, container);
		return newSourceFolder;
	}

	private static async CreateNewSourceFolder(vaultPath: string, vault: Vault, container: HTMLDivElement): Promise<SourceFolder> {
		const newSourceFolder = new SourceFolder(vaultPath, 0);
		try {
			await vault.createFolder(vaultPath);
		} finally {
			const sourcePath = normalizePath(vaultPath + '/source.json');
			await vault.adapter.write(sourcePath, '0');
		}
		return newSourceFolder;
	}

	private static async LoadExistingSource(vaultPath: string, vault: Vault, container: HTMLDivElement): Promise<SourceFolder> {
		const sourceTFile = vault.getFileByPath(vaultPath + '/source.json');
		if (sourceTFile === null) {
			new Notice("Source File could not be found at the path: " + vaultPath + '/source.json');
			throw Error("Source File could not be found at the path: " + vaultPath + '/source.json');
		}
		const jsonData = await vault.cachedRead(sourceTFile);

		const newSourceFolder = <SourceFolder> await JSON.parse(jsonData);
		return newSourceFolder;
	}

	/**
	 * Saves the new file count
	 */
	static async Save(sourceAndVault: SourceAndVault) {
		const sourceFolder = sourceAndVault.sourceFolder;
		const vault = sourceAndVault.vault;

		// Find the file and check that it isn't null
		const tFile = vault.getFileByPath(sourceFolder.vaultPath + '/source.json');
		if (tFile === null) {
			new Notice("Source File could not be found at the path: " + sourceFolder.vaultPath + '/source.json');
			throw Error("Source File could not be found at the path: " + sourceFolder.vaultPath + '/source.json');
		}

		const jsonData = JSON.stringify(sourceFolder);
		await vault.modify(tFile, jsonData);
	}
}

export class SourceAndVault {
	sourceFolder: SourceFolder;
	vault: Vault;
	constructor(sourceFolder: SourceFolder, vault: Vault) {
		this.sourceFolder = sourceFolder;
		this.vault = vault;
	}
}
//#endregion

//#region File Creator UI
/**
 * Represents and handles the pop up UI behind creating a file.
 */
export class FileCreatorForm {
	sourceAndVault: SourceAndVault;
	popUpContainer: HTMLDivElement;
	inputListsContainer: HTMLDivElement;
	inputLists: FileCreatorInputList[];
	dropdown: HTMLSelectElement;
	getSelectedFileType() {
		return this.dropdown.value;
	}
	fileNameInput: HTMLInputElement;
	getFileName() {
		return this.fileNameInput.value;
	}
	parentFolderIDInput: HTMLInputElement;
	getParentFolderID() {
		return this.parentFolderIDInput.value;
	}
	submitButton: HTMLInputElement | HTMLButtonElement | HTMLDivElement;

	/**
	 * Warning! This constructor loads the UI asynchronously!
	 */
	constructor(popUpContainer: HTMLDivElement, sourceAndVault: SourceAndVault) {
		this.sourceAndVault = sourceAndVault;
		popUpContainer.className = 'cfe-create-file-pop-up';
		this.popUpContainer = popUpContainer;
		this.inputLists = [];
		const header = popUpContainer.createDiv('cfe-file-creator-header');
		header.createEl('p', { text: 'Choose a File Type to create: ' } );
		this.dropdown = header.createEl('select');
		for (let i = 0; i < FormattedFileHandler.KnownFileTypes.length; i++) {
			const option = this.dropdown.createEl('option');
			option.value = FormattedFileHandler.KnownFileTypes[i];
			option.text = FormattedFileHandler.KnownFileTypes[i];
			this.dropdown.options.add(option);
		}
		const exitButton = header.createEl('button', { text: 'X', cls: 'cfe-exit-button' } );
		exitButton.onclick = () => {
			popUpContainer.style.display = 'none';
		}
		this.inputListsContainer = this.popUpContainer.createDiv('cfe-file-creator-input-form');
		this.submitButton = this.popUpContainer.createEl('button', { text: 'Create' } );
		this.LoadUI();
	}
	private async LoadUI() {
		this.dropdown.onchange = async () => {
			this.inputListsContainer.empty();
			this.inputLists = [];
			await FormattedFileHandler.CreateInputLists(this);
		}
		await FormattedFileHandler.CreateInputLists(this);
		this.submitButton.onclick = async () => {
			await FormattedFileHandler.CreateNew(this);
		}
	}

}

export class FileCreatorInputList {
	private fileTypeTitle: HTMLHeadingElement;
	listContainer: HTMLDivElement;
	inputFields: FileCreatorInputField[];
	
	constructor(fileType: string, formContainer: HTMLDivElement) {
		this.listContainer = formContainer.createDiv('cfe-input-list');
		this.fileTypeTitle = this.listContainer.createEl('h4');
		this.setFileType(fileType);
		this.inputFields = [];
	}

	private setFileType(fileType: string) {
		this.fileTypeTitle.textContent = fileType + ' Requirements';
	}
}

export class FileCreatorInputField {
	private inputNameElement: HTMLParagraphElement;
	itemContainer: HTMLDivElement;
	inputs: (CustomInputElement | HTMLInputElement)[];
	getValuesAsString(): string {
		let values = '';
		for (let i = 0; i < this.inputs.length; i++) {
			values += this.inputs[i].value;
		}
		return values;
	}
	getValuesAsList(): string[] {
		const values = [];
		for (let i = 0; i < this.inputs.length; i++) {
			values.push(this.inputs[i].value);
		}
		return values;
	}
	constructor(itemContainer: HTMLDivElement, inputName: string) {
		this.itemContainer = itemContainer;
		this.itemContainer.className = 'vbox';
		this.inputNameElement = itemContainer.createEl('p');
		this.setName(inputName);
		this.inputs = [];
	}
	private setName(inputName: string) {
		this.inputNameElement.textContent = inputName;
	}
}

export abstract class CustomInputElement {
	get value() {
		return this.getValue();
	}
	private getValue: () => string;
	constructor(getValue: () => string) {
		this.getValue = getValue;
	}
}
//#endregion

//#region Formatted File Handler
export class FormattedFileHandler {

	/**
	 * All of the known file formats
	 */
	static KnownFileTypes: string[] = [
		'Base File',
		'Folder',
		'Video',
		'Playlist'
	]

	static async CreateNew(inputForm: FileCreatorForm): Promise<CFEFile> {
		let newFile: CFEFile;
		switch(inputForm.getSelectedFileType()) {
			case 'Base File':
				newFile = await CFEFile.CreateNewFileForLayer(inputForm, new CFEFile());
				break;
			case 'Folder':
				newFile = await Folder.CreateNewFileForLayer(inputForm, new CFEFile());
				break;
			case 'Video':
				newFile = await Video.CreateNewFileForLayer(inputForm, new CFEFile());
				break;
			case 'Playlist':
				newFile = await Playlist.CreateNewFileForLayer(inputForm, new CFEFile());
				break;
			default:
				newFile = await CFEFile.CreateNewFileForLayer(inputForm, new CFEFile());
				break;
		}
		this.SaveFile(inputForm.sourceAndVault, newFile);
		return newFile;
	}

	static async LoadFile(sourceAndVault: SourceAndVault, fileID: number): Promise<CFEFile> {
		const sourceFolder = sourceAndVault.sourceFolder;
		const vault = sourceAndVault.vault;

		const tFile = vault.getFileByPath(sourceFolder.vaultPath + '/' + fileID + '.json');
		if (tFile === null) {
			new Notice("File could not be found at the path: " + sourceFolder.vaultPath + '/' + fileID + '.json');
			throw Error("File could not be found at the path: " + sourceFolder.vaultPath + '/' + fileID + '.json');
		}
		const jsonData = await vault.cachedRead(tFile);
		const unfinishedFile = <CFEFile> JSON.parse(jsonData);
		switch(unfinishedFile.fileType) {
			case 'Base File':
				return unfinishedFile;
			case 'Folder':
				return <Folder> JSON.parse(jsonData);
			case 'Video':
				return <Video> JSON.parse(jsonData);
			case 'Playlist':
				return <Playlist> JSON.parse(jsonData);
			default:
				return unfinishedFile;
		}
	}

	static async Display(sourceAndVault: SourceAndVault, fileToDisplay: CFEFile, container: HTMLDivElement) {
		switch(fileToDisplay.fileType) {
			case 'Base File':
				return await CFEFile.DisplayForLayer(sourceAndVault, fileToDisplay, container);
			case 'Folder':
				return await Folder.DisplayForLayer(sourceAndVault, <Folder> fileToDisplay, container);
			case 'Video':
				return await Video.DisplayForLayer(sourceAndVault, <Video> fileToDisplay, container);
			case 'Playlist':
				return await Playlist.DisplayForLayer(sourceAndVault, <Playlist> fileToDisplay, container);
			default:
				return await CFEFile.DisplayForLayer(sourceAndVault, fileToDisplay, container);
		}
	}

	static async DisplayThumbnail(sourceAndVault: SourceAndVault, fileToDisplay: CFEFile, thumbnailContainer: HTMLDivElement, displayContainer: HTMLDivElement) {
		return await CFEFile.DisplayThumbnailForLayer(sourceAndVault, fileToDisplay, thumbnailContainer, displayContainer);
	}

	static async CreateInputLists(inputFormUI: FileCreatorForm) {
		switch(inputFormUI.getSelectedFileType()) {
			case 'Base File':
				return CFEFile.CreateInputListForLayer(inputFormUI);
			case 'Folder':
				return Folder.CreateInputListForLayer(inputFormUI);
			case 'Video':
				return Video.CreateInputListForLayer(inputFormUI);
			case 'Playlist':
				return Playlist.CreateInputListForLayer(inputFormUI);
			default:
				return CFEFile.CreateInputListForLayer(inputFormUI);
		}
	}

	static async SaveFile(sourceAndVault: SourceAndVault, fileToSave: CFEFile) {
		const sourceFolder = sourceAndVault.sourceFolder;
		const vault = sourceAndVault.vault;
		const filePath = sourceFolder.vaultPath + '/' + fileToSave.id + '.json';
		const jsonData = JSON.stringify(fileToSave);
		const tFile = vault.getFileByPath(filePath);
		if (tFile === null) {
			const normalizedPath = normalizePath(filePath);
			await vault.adapter.write(normalizedPath, jsonData);
			return;
		}
		await vault.modify(tFile, jsonData);
	}

	static async MoveFile(sourceAndVault: SourceAndVault, fileToMove: CFEFile, newParentFolderID: number) {
		await CFEFile.MoveFile(sourceAndVault, fileToMove, newParentFolderID);
	}
}
//#endregion

//#region File Types
/**
 * An interpretation of json files as a "file" of a specific "file format"
 * that can be interpreted and displayed by the plugin.
 */
export class CFEFile {
	
	static CLASS_DEPTH = 0;

	/**
	 * A unique (within the "source" of the current explorer) numerical identifier for the file
	 */
	id: number;

	/**
	 * The type of file
	 */
	fileType: string;

	/**
	 * The name of the file within the source
	 */
	fileName: string;

	/**
	 * The ID of the parent folder
	 */
	parentFolderID: number;

	private static readonly FILE_NAME_INPUT_INDEX = 0;
	private static readonly PARENT_FOLDER_ID_INPUT_INDEX = 1;

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.CreateNew() instead.
	 * 
	 * CHILD CLASSES SHOULD NOT WRITE TO A FILE. THIS IS DONE INSIDE OF FormattedFileHandler
	 * 
	 * CFEFile layer:
	 * 
	 * sets the source, id, file type, file name, and parent folder id of the file object.
	 */
	static async CreateNewFileForLayer(inputForm: FileCreatorForm, unfinishedFile: CFEFile): Promise<CFEFile> {
		const inputListForLayer = inputForm.inputLists[CFEFile.CLASS_DEPTH];
		const sourceAndVault = inputForm.sourceAndVault;
		const sourceFolder = sourceAndVault.sourceFolder;

		// Set the values of the unfinished file
		unfinishedFile.id = sourceFolder.fileCount;
		unfinishedFile.fileType = inputForm.getSelectedFileType();
		unfinishedFile.fileName = inputListForLayer.inputFields[this.FILE_NAME_INPUT_INDEX].getValuesAsString();
		unfinishedFile.parentFolderID = parseInt(inputListForLayer.inputFields[this.PARENT_FOLDER_ID_INPUT_INDEX].getValuesAsString());

		// Update the file count
		sourceFolder.fileCount++;
		await SourceFolder.Save(sourceAndVault);

		// Find the parent folder and add this file to it
		if (unfinishedFile.id !== unfinishedFile.parentFolderID) {
			const parentFolder = <Folder> (await FormattedFileHandler.LoadFile(sourceAndVault, unfinishedFile.parentFolderID));
			parentFolder.containedFileIDs.push(unfinishedFile.id);
			await FormattedFileHandler.SaveFile(sourceAndVault, parentFolder);
		}

		// Return the unfinished file so the next layer can add to it
		return unfinishedFile;
	}

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.DisplayThumbnail() instead.
	 * 
	 * CFEFile layer:
	 * 
	 * sets the thumbnail container's css class to 'cfe-thumbnail'
	 * and fully displays the file if the thumbnail is clicked.
	 */
	static async DisplayThumbnailForLayer(sourceAndVault: SourceAndVault, fileToDisplay: CFEFile, thumbnailContainer: HTMLDivElement, displayContainer: HTMLDivElement) {
		thumbnailContainer.className = 'cfe-thumbnail vbox';
		thumbnailContainer.onclick = async () => {
			await FormattedFileHandler.Display(sourceAndVault, fileToDisplay, displayContainer);
		}
		thumbnailContainer.createEl('p', { text: 'ID: ' + fileToDisplay.id } ).className = "cfe-thumbnail-name";
		thumbnailContainer.createEl('p', { text: '\nFile Type: ' + fileToDisplay.fileType } ).className = "cfe-thumbnail-name";
		thumbnailContainer.createEl('p', { text: '\nFile Name: ' + fileToDisplay.fileName } ).className = "cfe-thumbnail-name";
	}
	
	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.Display() instead.
	 * 
	 * CFEFile layer:
	 * 
	 * empties the display container provided.
	 */
	static async DisplayForLayer(sourceAndVault: SourceAndVault, fileToDisplay: CFEFile, container: HTMLDivElement) {
		container.empty();
		const headerContainer = container.createDiv('hbox');
		const backButton = headerContainer.createEl('button', { text: 'Back to parent folder' } );
		backButton.className = 'cfe-back-to-parent-button';
		backButton.onclick = async () => {
			const parentFolder = await FormattedFileHandler.LoadFile(sourceAndVault, fileToDisplay.parentFolderID);
			if (parentFolder !== null) {
				await FormattedFileHandler.Display(sourceAndVault, parentFolder, container);
			}
		}
	}

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.CreateInputLists() instead.
	 * 
	 * Formatted File layer:
	 * 
	 * ask for the file name and parent folder id.
	 */
	static async CreateInputListForLayer(inputFormUI: FileCreatorForm) {
		inputFormUI.inputLists.push(new FileCreatorInputList('Base File', inputFormUI.inputListsContainer));
		const inputListForLayer = inputFormUI.inputLists[CFEFile.CLASS_DEPTH];

		const fileNameInputField = new FileCreatorInputField(inputListForLayer.listContainer.createDiv(), 'File Name');
		const fileNameInputElement = fileNameInputField.itemContainer.createEl('input', { type: 'text' } );
		fileNameInputField.inputs.push(fileNameInputElement);
		inputListForLayer.inputFields.push(fileNameInputField);

		const parentFolderIDInputField = new FileCreatorInputField(inputListForLayer.listContainer.createDiv(), 'Parent Folder ID');
		const parentFolderIDInputElement = parentFolderIDInputField.itemContainer.createEl('input', { type: 'text' } );
		parentFolderIDInputField.inputs.push(parentFolderIDInputElement);
		inputListForLayer.inputFields.push(parentFolderIDInputField);
	}

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * (it is unlikely this method will ever be overriden by child classes, but making this 'inaccessible' is for consistency)
	 * 
	 * Use FormattedFileHandler.SaveFile() instead.
	 * 
	 * Formatted File layer:
	 * 
	 * Deletes this file ID from the original parent folder, adds this file to the new parent folder, and changes the parent folder ID
	 */
	static async MoveFile(sourceAndVault: SourceAndVault, fileToMove: CFEFile, newParentFolderID: number) {
		// Delete this file id from the original parent folder
		const oldParentFolder = <Folder> (await FormattedFileHandler.LoadFile(sourceAndVault, fileToMove.parentFolderID));
		const indexOfFile = oldParentFolder.containedFileIDs.indexOf(fileToMove.id);
		oldParentFolder.containedFileIDs.splice(indexOfFile, 1);
		FormattedFileHandler.SaveFile(sourceAndVault, oldParentFolder); // this can be done asynchronously without affecting the others

		// Add this file to the new parent folder
		const newParentFolder = <Folder> (await FormattedFileHandler.LoadFile(sourceAndVault, newParentFolderID));
		newParentFolder.containedFileIDs.push(fileToMove.id);
		FormattedFileHandler.SaveFile(sourceAndVault, newParentFolder); // this can be done asynchronously without affecting the others

		fileToMove.parentFolderID = newParentFolderID;
		FormattedFileHandler.SaveFile(sourceAndVault, fileToMove); // this can be done asynchronously without affecting the others
	}
}

/**
 * A child class of the CFEFile class. Represents a folder within the SourceFolder.
 */
export class Folder extends CFEFile {
	static CLASS_DEPTH = 1;

	/**
	 * The IDs of files contained in this folder
	 */
	containedFileIDs: number[];

	/**
	 * @override Folder layer:
	 * 
	 * initializes the contained file ids array for the folder object
	 */
	static override async CreateNewFileForLayer(inputForm: FileCreatorForm, unfinishedFile: CFEFile): Promise<Folder> {
		const unfinishedFolder = <Folder> (await super.CreateNewFileForLayer(inputForm, unfinishedFile));
		unfinishedFolder.containedFileIDs = [];
		return unfinishedFolder;
	}

	static async LoadOrCreateRootFolder(source: SourceFolder, vault: Vault): Promise<Folder> {
		let newFolder: Folder;
		const rootFolderPath = source.vaultPath + '/0.json';

		if (source.fileCount === 0) {
			source.fileCount = 1;

			newFolder = new Folder();
			newFolder.id = 0;
			newFolder.fileType = 'Folder';
			newFolder.fileName = 'root folder';
			newFolder.parentFolderID = 0;
			newFolder.containedFileIDs = [];
		} else {
			const tFile = vault.getFileByPath(rootFolderPath);
			if (tFile === null) {
				throw Error('Root Folder was not found at path: ' + rootFolderPath);
			}
			const jsonData = await vault.cachedRead(tFile);
			newFolder = JSON.parse(jsonData);
		}

		return newFolder;
	}

	static override async DisplayForLayer(sourceAndVault: SourceAndVault, folderToDisplay: Folder, container: HTMLDivElement) {
		await super.DisplayForLayer(sourceAndVault, folderToDisplay, container);
		const folderDisplayContainer = container.createDiv('vbox');
		const createFileButton = folderDisplayContainer.createEl('button', { text: 'Create new File' } );
		createFileButton.className = 'cfe-create-file-button';
		createFileButton.onclick = () => {
			new FileCreatorForm(container.createDiv(), sourceAndVault);
		}
		for (let i = 0; i < folderToDisplay.containedFileIDs.length; i++) {
			const containedFile = await FormattedFileHandler.LoadFile(sourceAndVault, folderToDisplay.containedFileIDs[i]);
			if (containedFile !== null) {
				await FormattedFileHandler.DisplayThumbnail(sourceAndVault, containedFile, folderDisplayContainer.createDiv(), container);
			}
		}
	}
}

export class Image extends CFEFile {
	static CLASS_DEPTH = 1;

	extensionName: string;

	static override async CreateNewFileForLayer(inputForm: FileCreatorForm, unfinishedFile: CFEFile): Promise<Image> {
		const sourceFolder = inputForm.sourceAndVault.sourceFolder;
		const vault = inputForm.sourceAndVault.vault;

		const newImageFile = <Image> (await super.CreateNewFileForLayer(inputForm, unfinishedFile));
		const imageFileInput = <HTMLInputElement> inputForm.inputLists[Video.CLASS_DEPTH].inputFields[0].inputs[0];
		const imageFileArray = imageFileInput.files;
		if (imageFileArray === null) {
			throw Error("no file was selected");
		}
		const imageFile = imageFileArray[0];
		const partsOfPath = imageFile.name.split('.');
		const extension = partsOfPath[partsOfPath.length - 1];
		newImageFile.extensionName = extension;
		const path = sourceFolder.vaultPath + '/' + newImageFile.id + '.' + extension;
		const normalizedPath = normalizePath(path);
		await vault.adapter.writeBinary(normalizedPath, await imageFile.arrayBuffer());
		return newImageFile;
	}

	static override async DisplayForLayer(sourceAndVault: SourceAndVault, imageToDisplay: Image, container: HTMLDivElement) {
		const sourceFolder = sourceAndVault.sourceFolder;
		const vault = sourceAndVault.vault;

		await super.DisplayForLayer(sourceAndVault, imageToDisplay, container);
		const imageDisplayContainer = container.createDiv('cfe-display-image');
		const imageElement = imageDisplayContainer.createEl('img');

		const imagePath = sourceFolder.vaultPath + '/' + imageToDisplay.id + '.' + imageToDisplay.extensionName;
		const imageFile = vault.getFileByPath(imagePath);
		if (imageFile === null) {
			throw Error('Image not found at path: ' + imagePath);
		}
		const arrayBuffer = await vault.readBinary(imageFile);
		const blob = new Blob([arrayBuffer]);
		const imageUrl = URL.createObjectURL(blob);
		imageElement.src = imageUrl;
	}

	static override async CreateInputListForLayer(inputFormUI: FileCreatorForm) {
		await super.CreateInputListForLayer(inputFormUI);
		inputFormUI.inputLists.push(new FileCreatorInputList('Image', inputFormUI.inputListsContainer));
		const inputListForLayer = inputFormUI.inputLists[Image.CLASS_DEPTH];

		const imageFileInputField = new FileCreatorInputField(inputListForLayer.listContainer.createDiv(), 'Image File');
		const imageFileInputElement = imageFileInputField.itemContainer.createEl('input', { type: 'file' } );
		imageFileInputField.inputs.push(imageFileInputElement);
		inputListForLayer.inputFields.push(imageFileInputField);
	}
}

export class Video extends CFEFile {
	static CLASS_DEPTH = 1;

	extensionName: string;

	static override async CreateNewFileForLayer(inputForm: FileCreatorForm, unfinishedFile: CFEFile): Promise<Video> {
		const sourceFolder = inputForm.sourceAndVault.sourceFolder;
		const vault = inputForm.sourceAndVault.vault;

		const newVideoFile = <Video> (await super.CreateNewFileForLayer(inputForm, unfinishedFile));
		const videoFileInput = <HTMLInputElement> inputForm.inputLists[Video.CLASS_DEPTH].inputFields[0].inputs[0];
		const videoFileArray = videoFileInput.files;
		if (videoFileArray === null) {
			throw Error("no file was selected");
		}
		const videoFile = videoFileArray[0];
		const partsOfPath = videoFile.name.split('.');
		const extension = partsOfPath[partsOfPath.length - 1];
		newVideoFile.extensionName = extension;
		const path = sourceFolder.vaultPath + '/' + newVideoFile.id + '.' + extension;
		const normalizedPath = normalizePath(path);
		await vault.adapter.writeBinary(normalizedPath, await videoFile.arrayBuffer());
		return newVideoFile;
	}

	static override async DisplayForLayer(sourceAndVault: SourceAndVault, videoToDisplay: Video, container: HTMLDivElement) {
		const sourceFolder = sourceAndVault.sourceFolder;
		const vault = sourceAndVault.vault;

		await super.DisplayForLayer(sourceAndVault, videoToDisplay, container);
		const videoDisplayContainer = container.createDiv('cfe-display-video');
		const videoElement = videoDisplayContainer.createEl('video');

		const videoPath = sourceFolder.vaultPath + '/' + videoToDisplay.id + '.' + videoToDisplay.extensionName;
		const videoFile = vault.getFileByPath(videoPath);
		if (videoFile === null) {
			throw Error('Video not found at path: ' + videoPath);
		}
		const arrayBuffer = await vault.readBinary(videoFile);
		const blob = new Blob([arrayBuffer]);
		const videoUrl = URL.createObjectURL(blob);
		videoElement.src = videoUrl;
		videoElement.controls = true;
	}

	static override async CreateInputListForLayer(inputForm: FileCreatorForm) {
		await super.CreateInputListForLayer(inputForm);
		inputForm.inputLists.push(new FileCreatorInputList('Video', inputForm.inputListsContainer));
		const inputListForLayer = inputForm.inputLists[Video.CLASS_DEPTH];

		const videoFileInputField = new FileCreatorInputField(inputListForLayer.listContainer.createDiv(), 'Video File');
		const videoFileInputElement = videoFileInputField.itemContainer.createEl('input', { type: 'file' } );
		videoFileInputField.inputs.push(videoFileInputElement);
		inputListForLayer.inputFields.push(videoFileInputField);
	}
}

export class Playlist extends CFEFile {
	static CLASS_DEPTH = 1;

	private currentVideoIndex: number;
	videoIDs: number[];

	private videoOrder: string;

	private static getNextVideoIDInOrder(playlist: Playlist) {
		let nextVideoIndex = playlist.currentVideoIndex + 1;
		if (nextVideoIndex >= playlist.videoIDs.length) {
			nextVideoIndex = 0;
		}
		return nextVideoIndex;
	}
	private static getNextVideoIDShuffled(playlist: Playlist) {
		let nextVideoIndex = Math.random() * playlist.videoIDs.length;
		nextVideoIndex = Math.floor(nextVideoIndex);
		return nextVideoIndex;
	}

	private static async loadNextVideo(sourceAndVault: SourceAndVault, playlist: Playlist, videoElement: HTMLVideoElement) {
		const sourceFolder = sourceAndVault.sourceFolder;
		const vault = sourceAndVault.vault;

		if (playlist.videoOrder === 'shuffled') {
			playlist.currentVideoIndex = Playlist.getNextVideoIDShuffled(playlist);
		} else {
			playlist.currentVideoIndex = Playlist.getNextVideoIDInOrder(playlist);
		}
		const nextVideo = <Video> (await FormattedFileHandler.LoadFile(sourceAndVault, playlist.videoIDs[playlist.currentVideoIndex]));
		const nextVideoPath = sourceFolder.vaultPath + '/' + nextVideo.id + '.' + nextVideo.extensionName;
		const nextVideoFile = vault.getFileByPath(nextVideoPath);
		if (nextVideoFile === null) {
			throw Error('Video not found at path: ' + nextVideoPath);
		}
		const nextArrayBuffer = await vault.readBinary(nextVideoFile);
		const nextBlob = new Blob([nextArrayBuffer]);
		const nextVideoUrl = URL.createObjectURL(nextBlob);
		videoElement.src = nextVideoUrl;
	}

	static override async CreateNewFileForLayer(inputForm: FileCreatorForm, unfinishedFile: CFEFile): Promise<Playlist> {
		const newPlaylistFile = <Playlist> (await super.CreateNewFileForLayer(inputForm, unfinishedFile));
		newPlaylistFile.videoIDs = [];
		const inputListForLayer = inputForm.inputLists[Playlist.CLASS_DEPTH];
		const inputtedVideoIDs = inputListForLayer.inputFields[0].inputs;
		const numVideos = inputtedVideoIDs.length;
		for (let i = 0; i < numVideos; i++) {
			const videoID = parseInt(inputtedVideoIDs[i].value);
			newPlaylistFile.videoIDs.push(videoID);
		}
		return newPlaylistFile;
	}

	static override async DisplayForLayer(sourceAndVault: SourceAndVault, playlistToDisplay: Playlist, container: HTMLDivElement) {
		const sourceFolder = sourceAndVault.sourceFolder;
		const vault = sourceAndVault.vault;

		await super.DisplayForLayer(sourceAndVault, playlistToDisplay, container);
		playlistToDisplay.currentVideoIndex = 0;
		const videoDisplayContainer = container.createDiv('cfe-display-video');
		const videoElement = videoDisplayContainer.createEl('video');
		const buttonsContainer = container.createDiv('hbox');
		const hideButton = buttonsContainer.createEl('button', { text: 'hide video' } );
		hideButton.onclick = () => {
			if (hideButton.textContent === 'hide video') {
				hideButton.textContent = 'show video';
				videoElement.style.display = 'none';
			} else {
				hideButton.textContent = 'hide video';
				videoElement.style.display = 'flex';
			}
		}
		const shuffleButton = buttonsContainer.createEl('button', { text: 'shuffle' } );
				playlistToDisplay.videoOrder = 'in order';
		shuffleButton.onclick = () => {
			if (shuffleButton.textContent === 'shuffle') {
				shuffleButton.textContent = 'go in order';
				playlistToDisplay.videoOrder = 'shuffled';
			} else {
				shuffleButton.textContent = 'shuffle';
				playlistToDisplay.videoOrder = 'in order';
			}
		}
		const nextButton = buttonsContainer.createEl('button', { text: 'next video' } );
		nextButton.onclick = async () => {
			await Playlist.loadNextVideo(sourceAndVault, playlistToDisplay, videoElement);
		}

		const firstVideo = <Video> (await FormattedFileHandler.LoadFile(sourceAndVault, playlistToDisplay.videoIDs[playlistToDisplay.currentVideoIndex]));
		const videoPath = sourceFolder.vaultPath + '/' + firstVideo.id + '.' + firstVideo.extensionName;
		const videoFile = vault.getFileByPath(videoPath);
		if (videoFile === null) {
			throw Error('Video not found at path: ' + videoPath);
		}
		const arrayBuffer = await vault.readBinary(videoFile);
		const blob = new Blob([arrayBuffer]);
		const videoUrl = URL.createObjectURL(blob);
		videoElement.src = videoUrl;
		videoElement.autoplay = true;
		videoElement.controls = true;
		videoElement.ontimeupdate = async () => {
			if (videoElement.ended) {
				await Playlist.loadNextVideo(sourceAndVault, playlistToDisplay, videoElement);
			}
		}
	}

	static override async CreateInputListForLayer(inputForm: FileCreatorForm) {
		await super.CreateInputListForLayer(inputForm);
		inputForm.inputLists.push(new FileCreatorInputList('Playlist', inputForm.inputListsContainer));
		const inputList = inputForm.inputLists[Playlist.CLASS_DEPTH];
		const videoFileInput = new FileCreatorInputField(inputList.listContainer.createDiv(), 'Videos');
		const buttonsContainer = videoFileInput.itemContainer.createDiv('hbox');
		const addButton = buttonsContainer.createEl('button', { text: 'Add Video' } );
		addButton.onclick = () => {
			videoFileInput.inputs.push(videoFileInput.itemContainer.createEl('input', { type: 'text' } ));
			inputList.inputFields.push(videoFileInput);
		}
		const removeButton = buttonsContainer.createEl('button', { text: 'Remove Video' } );
		removeButton.className = 'cfe-remove-button';
		removeButton.onclick = () => {
			videoFileInput.itemContainer.lastChild?.remove();
			videoFileInput.inputs.shift();
		}
	}
}
//#endregion
