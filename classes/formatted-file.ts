import { normalizePath, Notice, TFile, Vault } from "obsidian";

//#region Source
/**
 * A representation of the source (similar to a vault). Contains a reference to the vault path and file count.
 */
export class Source {
	container: HTMLDivElement;
	FileCount: number;
	VaultPath: string;
	vault: Vault;

	constructor (vaultPath: string, vault: Vault, container: HTMLDivElement) {
		this.VaultPath = vaultPath;
		this.VaultPath = this.VaultPath.endsWith('/source.md') ? this.VaultPath.slice(0, -10) : this.VaultPath;
		this.vault = vault;
		this.container = container;
		const exists = vault.getFileByPath(vaultPath + '/source.md') !== null;
		if (exists) {
			this.LoadExistingSource();
		} else {
			this.CreateNewSource();
		}
	}

	private async CreateNewSource() {
		this.FileCount = 0;
		try {
			await this.vault.createFolder(this.VaultPath);
		} finally {
			const sourcePath = normalizePath(this.VaultPath + '/source.md');
			await this.vault.adapter.write(sourcePath, '0');
			const rootFolder = await Folder.LoadOrCreateRootFolder(this);
			await FormattedFileHandler.Display(rootFolder, this.container);
		}
	}

	private async LoadExistingSource() {
		const sourceTFile = this.vault.getFileByPath(this.VaultPath + '/source.md');
		if (sourceTFile === null) {
			new Notice("Source File could not be found at the path: " + this.VaultPath + '/source.md');
			return null;
		}
		const fileCountData = (await this.vault.cachedRead(sourceTFile)).split('\n').filter((line) => line.length > 0);
		this.FileCount = parseInt(fileCountData[0]);
		const rootFolder = await Folder.LoadOrCreateRootFolder(this);
		await FormattedFileHandler.Display(rootFolder, this.container);
	}

	/**
	 * Saves the new file count
	 */
	async Save() {
		// Find the file and check that it isn't null
		const sourceTFile = this.vault.getFileByPath(this.VaultPath + '/source.md');
		if (sourceTFile === null) {
			new Notice("Source File could not be found at the path: " + this.VaultPath + '/source.md');
			throw Error("Source File could not be found at the path: " + this.VaultPath + '/source.md');
		}

		// Save the new file count
		await this.vault.modify(sourceTFile, '' + this.FileCount);
	}
}
//#endregion

//#region File Creator UI
/**
 * Represents and handles the pop up UI behind creating a file.
 */
export class FileCreatorUI {
	Source: Source;
	PopUpContainer: HTMLDivElement;
	InputListsContainer: HTMLDivElement;
	InputLists: FileCreatorInputList[];
	Dropdown: HTMLSelectElement;
	SelectedFileType() {
		return this.Dropdown.value;
	}
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
		this.InputLists = [];
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
		this.InputListsContainer = this.PopUpContainer.createDiv('cfe-file-creator-input-form');
		this.SubmitButton = this.PopUpContainer.createEl('button', { text: 'Create' } );
		this.LoadUI();
	}
	private async LoadUI() {
		this.Dropdown.onchange = async () => {
			this.InputListsContainer.empty();
			this.InputLists = [];
			await FormattedFileHandler.CreateInputLists(this);
		}
		await FormattedFileHandler.CreateInputLists(this);
		this.SubmitButton.onclick = async () => {
			await FormattedFileHandler.CreateNew(this);
		}
	}

}

export class FileCreatorInputList {
	private fileTypeTitle: HTMLHeadingElement;
	listContainer: HTMLDivElement;
	inputList: FileCreatorInputField[];
	
	constructor(formContainer: HTMLDivElement) {
		this.listContainer = formContainer.createDiv('cfe-input-list');
		this.fileTypeTitle = this.listContainer.createEl('h4');
		this.inputList = [];
	}

	SetFileType(fileType: string) {
		this.fileTypeTitle.textContent = fileType + ' Requirements';
	}
}

export class FileCreatorInputField {
	private inputNameElement: HTMLParagraphElement;
	itemContainer: HTMLDivElement;
	inputs: HTMLInputElement[];
	GetValuesAsString(): string {
		let values = '';
		console.log('length: ' + this.inputs.length + ', value: ' + this.inputs[0].value);
		for (let i = 0; i < this.inputs.length; i++) {
			values += this.inputs[i].value;
		}
		return values;
	}
	GetValuesAsList(): string[] {
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
		this.SetName(inputName);
		this.inputs = [];
	}
	SetName(inputName: string) {
		this.inputNameElement.textContent = inputName;
	}
}
//#endregion

//#region Formatted File Handler
export class FormattedFileHandler {
	static async CreateNew(inputForm: FileCreatorUI): Promise<FormattedFile> {
		const newFile = new FormattedFile();
		switch(inputForm.SelectedFileType()) {
			case 'Base File':
				return await FormattedFile.CreateNewFileForLayer(inputForm, <FormattedFile> newFile);
			case 'Folder':
				return await Folder.CreateNewFileForLayer(inputForm, <Folder> newFile);
			case 'Video':
				return await Video.CreateNewFileForLayer(inputForm, <Video> newFile);
			case 'Playlist':
				return await Playlist.CreateNewFileForLayer(inputForm, <Playlist> newFile);
			default:
				return await FormattedFile.CreateNewFileForLayer(inputForm, newFile);
		}
	}
	static async LoadFile(source: Source, fileID: number): Promise<FormattedFile> {
		const data = await FormattedFile.GetFileDataByID(source, fileID);
		const fileType = FormattedFile.GetDataForLayer(data, FormattedFile.CLASS_DEPTH)[0];
		switch(fileType) {
			case 'Base File':
				return await FormattedFile.LoadLayer(source, fileID, data);
			case 'Folder':
				return await Folder.LoadLayer(source, fileID, data);
			case 'Video':
				return await Video.LoadLayer(source, fileID, data);
			case 'Playlist':
				return await Playlist.LoadLayer(source, fileID, data);
			default:
				return await FormattedFile.LoadLayer(source, fileID, data);
		}
	}
	static async Display(fileToDisplay: FormattedFile, container: HTMLDivElement) {
		switch(fileToDisplay.FileType) {
			case 'Base File':
				return await Folder.DisplayForLayer(<Folder> fileToDisplay, container);
			case 'Folder':
				return await Folder.DisplayForLayer(<Folder> fileToDisplay, container);
			case 'Video':
				return await Video.DisplayForLayer(<Video> fileToDisplay, container);
			case 'Playlist':
				return await Playlist.DisplayForLayer(<Playlist> fileToDisplay, container);
			default:
				return await FormattedFile.DisplayForLayer(fileToDisplay, container);
		}
	}
	static async DisplayThumbnail(fileToDisplay: FormattedFile, thumbnailContainer: HTMLDivElement, displayContainer: HTMLDivElement) {
		switch(fileToDisplay.FileType) {
			case 'Base File':
				return await FormattedFile.DisplayThumbnailForLayer(<FormattedFile> fileToDisplay, thumbnailContainer, displayContainer);
			case 'Folder':
				return await Folder.DisplayThumbnailForLayer(<Folder> fileToDisplay, thumbnailContainer, displayContainer);
			case 'Video':
				return await Video.DisplayThumbnailForLayer(<Video> fileToDisplay, thumbnailContainer, displayContainer);
			case 'Playlist':
				return await Playlist.DisplayThumbnailForLayer(<Playlist> fileToDisplay, thumbnailContainer, displayContainer);
			default:
				return await FormattedFile.DisplayThumbnailForLayer(fileToDisplay, thumbnailContainer, displayContainer);
		}
	}
	static async CreateInputLists(inputFormUI: FileCreatorUI) {
		switch(inputFormUI.SelectedFileType()) {
			case 'Base File':
				return FormattedFile.CreateInputListForLayer(inputFormUI);
			case 'Folder':
				return Folder.CreateInputListForLayer(inputFormUI);
			case 'Video':
				return Video.CreateInputListForLayer(inputFormUI);
			case 'Playlist':
				return Playlist.CreateInputListForLayer(inputFormUI);
			default:
				return FormattedFile.CreateInputListForLayer(inputFormUI);
		}
	}

	static async SaveFile(fileToSave: FormattedFile) {
		const filePath = fileToSave.Source.VaultPath + '/' + fileToSave.ID + '.md';
		const tFile = fileToSave.Source.vault.getFileByPath(filePath);
		if (tFile === null) {
			new Notice("Source File could not be found at the path: " + filePath);
			throw Error();
		}
		switch(fileToSave.FileType) {
			case 'Base File':
				return await FormattedFile.SaveFileForLayer(tFile, <FormattedFile> fileToSave);
			case 'Folder':
				return await Folder.SaveFileForLayer(tFile, <Folder> fileToSave);
			case 'Video':
				return await Video.SaveFileForLayer(tFile, <Video> fileToSave);
			case 'Playlist':
				return await Playlist.SaveFileForLayer(tFile, <Playlist> fileToSave);
			default:
				return await FormattedFile.SaveFileForLayer(tFile, fileToSave);
		}
	}
	static async MoveFile(fileToMove: FormattedFile, newParentFolderID: number) {
		await FormattedFile.MoveFile(fileToMove, newParentFolderID);
	}
}
//#endregion

//#region File Types
/**
 * An interpretation of specific markdown files (could switch to json in the future)
 * as "file formats" that can be interpreted and displayed by the plugin.
 */
export class FormattedFile {
	
	static CLASS_DEPTH = 0;

	static readonly LAYER_SEPARATING_STRING = '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-\n';

	/**
	 * A reference to the path to the source object.
	 */
	Source: Source;

	/**
	 * A unique (within the "source" of the current explorer) numerical identifier for the file
	 */
	ID: number;

	/**
	 * The type of file
	 */
	FileType: string;

	/**
	 * All of the known file formats (child classes)
	 */
	static KnownFileTypes: string[] = [
		'Base File',
		'Folder',
		'Video',
		'Playlist'
	]

	/**
	 * The name of the file within the source
	 */
	FileName: string;

	/**
	 * The ID of the parent folder
	 */
	ParentFolderID: number;

	private static readonly FILE_NAME_INPUT_INDEX = 0;
	private static readonly PARENT_FOLDER_ID_INPUT_INDEX = 1;

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.CreateNew() instead.
	 * 
	 * FormattedFile layer:
	 * 
	 * sets the source, id, file type, file name, and parent folder id of the file object.
	 */
	static async CreateNewFileForLayer(inputForm: FileCreatorUI, unfinishedFile: FormattedFile): Promise<FormattedFile> {
		console.log(inputForm.InputLists.length);
		const inputListForLayer = inputForm.InputLists[FormattedFile.CLASS_DEPTH];
		
		// Set the values of the unfinished file
		unfinishedFile.Source = inputForm.Source;
		unfinishedFile.ID = unfinishedFile.Source.FileCount;
		unfinishedFile.FileType = inputForm.SelectedFileType();
		console.log('index 0: ' + inputListForLayer.inputList[0].GetValuesAsString());
		console.log('index 1: ' + inputListForLayer.inputList[1].GetValuesAsString());
		unfinishedFile.FileName = inputListForLayer.inputList[this.FILE_NAME_INPUT_INDEX].GetValuesAsString();
		unfinishedFile.ParentFolderID = parseInt(inputListForLayer.inputList[this.PARENT_FOLDER_ID_INPUT_INDEX].GetValuesAsString());

		// Update the file count
		unfinishedFile.Source.FileCount++;
		await unfinishedFile.Source.Save();

		// Find the parent folder and add this file to it
		if (unfinishedFile.ID !== unfinishedFile.ParentFolderID) {
			new Notice('' + unfinishedFile.ID + ', ' + unfinishedFile.ParentFolderID);
			console.log('' + unfinishedFile.ID + ', ' + unfinishedFile.ParentFolderID);
			const parentFolder = <Folder> (await FormattedFileHandler.LoadFile(unfinishedFile.Source, unfinishedFile.ParentFolderID));
			parentFolder.ContainedFileIDs.push(unfinishedFile.ID);
			await FormattedFileHandler.SaveFile(parentFolder);
		}

		// Save the file to a new md file
		const filePath = normalizePath(unfinishedFile.Source.VaultPath + '/' + unfinishedFile.ID + '.md');
		let dataToSave = FormattedFile.LAYER_SEPARATING_STRING;
		dataToSave += unfinishedFile.FileType + '\n';
		dataToSave += unfinishedFile.FileName + '\n';
		dataToSave += unfinishedFile.ParentFolderID + '\n';
		await unfinishedFile.Source.vault.adapter.write(filePath, dataToSave);
		
		// Return the unfinished file so the next layer can add to it
		return unfinishedFile;
	}

	/**
	 * Each layer (child class) of the file is its own string in the returned array
	 */
	static async GetFileDataByID(source: Source, fileID: number): Promise<string[]> {
		// Find the file and check that it isn't null
		const tFile = source.vault.getFileByPath(source.VaultPath + '/' + fileID + '.md');
		if (tFile === null) {
			new Notice("File could not be found at the path: " + source.VaultPath + '/' + fileID + '.md');
			throw Error("File could not be found at the path: " + source.VaultPath + '/' + fileID + '.md');
		}

		return (await source.vault.cachedRead(tFile)).split(FormattedFile.LAYER_SEPARATING_STRING).filter((line) => line.length > 0);
	}
	
	static GetDataForLayer(data: string[], layerDepth: number): string[] {
		console.log(data.length);
		if (layerDepth >= data.length) {
			return [];
		}
		return data[layerDepth].split('\n').filter((line) => line.length > 0);
	}

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.LoadFile() instead.
	 * 
	 * FormattedFile layer:
	 * 
	 * finds and sets the source, id, file type, file name, and parent folder id of the file object.
	 */
	static async LoadLayer(source: Source, fileID: number, data: string[]): Promise<FormattedFile> {
		const newFile = new FormattedFile();

		// Find the data relevant to this class
		const dataForLayer = FormattedFile.GetDataForLayer(data, FormattedFile.CLASS_DEPTH);

		// Interpret the data
		newFile.FileType = dataForLayer[0];
		newFile.Source = source;
		newFile.ID = fileID;
		newFile.FileName = dataForLayer[1];
		newFile.ParentFolderID = parseInt(dataForLayer[2]);

		// Return the object
		return newFile;
	}

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.DisplayThumbnail() instead.
	 * 
	 * FormattedFile layer:
	 * 
	 * sets the thumbnail container's css class to 'cfe-thumbnail'
	 * and fully displays the file if the thumbnail is clicked.
	 */
	static async DisplayThumbnailForLayer(fileToDisplay: FormattedFile, thumbnailContainer: HTMLDivElement, displayContainer: HTMLDivElement) {
		thumbnailContainer.className = 'cfe-thumbnail vbox';
		thumbnailContainer.onclick = async () => {
			await FormattedFileHandler.Display(fileToDisplay, displayContainer);
		}
		thumbnailContainer.createEl('p', { text: 'ID: ' + fileToDisplay.ID } ).className = "cfe-thumbnail-name";
		thumbnailContainer.createEl('p', { text: '\nFile Type: ' + fileToDisplay.FileType } ).className = "cfe-thumbnail-name";
		thumbnailContainer.createEl('p', { text: '\nFile Name: ' + fileToDisplay.FileName } ).className = "cfe-thumbnail-name";
	}
	
	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.Display() instead.
	 * 
	 * FormattedFile layer:
	 * 
	 * empties the display container provided.
	 */
	static async DisplayForLayer(fileToDisplay: FormattedFile, container: HTMLDivElement) {
		container.empty();
		const source = fileToDisplay.Source;
		const headerContainer = container.createDiv('hbox');
		const backButton = headerContainer.createEl('button', { text: 'Back to parent folder' } );
		backButton.className = 'cfe-back-to-parent-button';
		backButton.onclick = async () => {
			const parentFolder = await FormattedFileHandler.LoadFile(source, fileToDisplay.ParentFolderID);
			if (parentFolder !== null) {
				await FormattedFileHandler.Display(parentFolder, container);
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
	static async CreateInputListForLayer(inputFormUI: FileCreatorUI) {
		inputFormUI.InputLists.push(new FileCreatorInputList(inputFormUI.InputListsContainer));
		const inputList = inputFormUI.InputLists[FormattedFile.CLASS_DEPTH];
		inputList.SetFileType('Base File');
		const fileNameInput = new FileCreatorInputField(inputList.listContainer.createDiv(), 'File Name');
		fileNameInput.inputs.push(fileNameInput.itemContainer.createEl('input', { type: 'text' } ));
		inputList.inputList.push(fileNameInput);
		const parentFolderIDInput = new FileCreatorInputField(inputList.listContainer.createDiv(), 'Parent Folder ID');
		parentFolderIDInput.inputs.push(parentFolderIDInput.itemContainer.createEl('input', { type: 'text' } ));
		inputList.inputList.push(parentFolderIDInput);
	}

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.SaveFile() instead.
	 * 
	 * Formatted File layer:
	 * 
	 * writes the file type, file name, and parent folder id to the file
	 */
	static async SaveFileForLayer(tFile: TFile, fileToSave: FormattedFile) {
		// Empty the file
		await fileToSave.Source.vault.modify(tFile, '');

		let dataForLayer = FormattedFile.LAYER_SEPARATING_STRING;
		dataForLayer += fileToSave.FileType + '\n';
		dataForLayer += fileToSave.FileName + '\n';
		dataForLayer += fileToSave.ParentFolderID + '\n';

		await fileToSave.Source.vault.append(tFile, dataForLayer);
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
	static async MoveFile(fileToMove: FormattedFile, newParentFolderID: number) {
		// Delete this file id from the original parent folder
		const oldParentFolder = <Folder> (await FormattedFileHandler.LoadFile(fileToMove.Source, fileToMove.ParentFolderID));
		const indexOfFile = oldParentFolder.ContainedFileIDs.indexOf(fileToMove.ID);
		oldParentFolder.ContainedFileIDs.splice(indexOfFile, 1);
		FormattedFileHandler.SaveFile(oldParentFolder); // this can be done asynchronously without affecting the others

		// Add this file to the new parent folder
		const newParentFolder = <Folder> (await FormattedFileHandler.LoadFile(fileToMove.Source, newParentFolderID));
		newParentFolder.ContainedFileIDs.push(fileToMove.ID);
		FormattedFileHandler.SaveFile(newParentFolder); // this can be done asynchronously without affecting the others

		fileToMove.ParentFolderID = newParentFolderID;
		FormattedFileHandler.SaveFile(fileToMove); // this can be done asynchronously without affecting the others
	}
}

/**
 * A child class of the FormattedFile class. Represents a folder within the source.
 */
export class Folder extends FormattedFile {
	static CLASS_DEPTH = 1;

	/**
	 * The IDs of files contained in this folder
	 */
	ContainedFileIDs: number[];

	/**
	 * @override Folder layer:
	 * 
	 * initializes the contained file ids array for the folder object
	 */
	static override async CreateNewFileForLayer(inputForm: FileCreatorUI, unfinishedFile: Folder): Promise<Folder> {
		await super.CreateNewFileForLayer(inputForm, unfinishedFile);
		unfinishedFile.ContainedFileIDs = [];
		return unfinishedFile;
	}

	static async LoadOrCreateRootFolder(source: Source): Promise<Folder> {
		const newFolder = new Folder();
		newFolder.Source = source;
		newFolder.ID = 0;
		newFolder.FileType = 'Folder';
		newFolder.FileName = 'root folder';
		newFolder.ParentFolderID = 0;
		newFolder.ContainedFileIDs = [];
		if (source.FileCount === 0) {
			source.FileCount = 1;
			await source.Save();
			const filePath = normalizePath(source.VaultPath + '/' + newFolder.ID + '.md');
			await source.vault.adapter.write(filePath, FormattedFile.LAYER_SEPARATING_STRING + 'Folder\nroot folder\n0');
			return newFolder;
		}
		const data = await FormattedFile.GetFileDataByID(source, 0);
		const folderLayerData = FormattedFile.GetDataForLayer(data, Folder.CLASS_DEPTH);
		for (let i = 0; i < folderLayerData.length; i++) {
			newFolder.ContainedFileIDs.push(parseInt(folderLayerData[i]));
		}
		return newFolder;
	}

	/**
	 * @override
	 * Folder layer:
	 * 
	 * finds and sets the contained file ids of the folder object.
	 */
	static override async LoadLayer(source: Source, fileID: number, data: string[]): Promise<Folder> {
		const newFolder = <Folder> (await FormattedFile.LoadLayer(source, fileID, data));
		const folderLayerData = FormattedFile.GetDataForLayer(data, Folder.CLASS_DEPTH);
		newFolder.ContainedFileIDs = [];
		for (let i = 0; i < folderLayerData.length; i++) {
			newFolder.ContainedFileIDs.push(parseInt(folderLayerData[i]));
		}
		return newFolder;
	}

	static override async DisplayForLayer(folderToDisplay: Folder, container: HTMLDivElement) {
		const source = folderToDisplay.Source;
		await super.DisplayForLayer(folderToDisplay, container);
		const folderDisplayContainer = container.createDiv('vbox');
		const createFileButton = folderDisplayContainer.createEl('button', { text: 'Create new File' } );
		createFileButton.className = 'cfe-create-file-button';
		createFileButton.onclick = () => {
			new FileCreatorUI(container.createDiv(), source);
		}
		for (let i = 0; i < folderToDisplay.ContainedFileIDs.length; i++) {
			const containedFile = await FormattedFileHandler.LoadFile(source, folderToDisplay.ContainedFileIDs[i]);
			if (containedFile !== null) {
				await FormattedFileHandler.DisplayThumbnail(containedFile, folderDisplayContainer.createDiv(), container);
			}
		}
	}

	static override async SaveFileForLayer(tFile: TFile, folderToSave: Folder, ) {
		await super.SaveFileForLayer(tFile, folderToSave);

		folderToSave.ContainedFileIDs.sort((a, b) => {
			return a - b;
		});
		let dataForLayer = FormattedFile.LAYER_SEPARATING_STRING;
		for (let i = 0; i < folderToSave.ContainedFileIDs.length; i++) {
			dataForLayer += folderToSave.ContainedFileIDs[i] + '\n';
		}

		folderToSave.Source.vault.append(tFile, dataForLayer);
	}
}

export class Image extends FormattedFile {
	static CLASS_DEPTH = 1;

	extensionName: string;

	static override async CreateNewFileForLayer(inputForm: FileCreatorUI, unfinishedFile: FormattedFile): Promise<Image> {
		const newImageFile = <Image> (await super.CreateNewFileForLayer(inputForm, unfinishedFile));
		const imageFileArray = inputForm.InputLists[Video.CLASS_DEPTH].inputList[0].inputs[0].files;
		if (imageFileArray === null) {
			throw Error("no file was selected");
		}
		const imageFile = imageFileArray[0];
		const partsOfPath = imageFile.name.split('.');
		const extension = partsOfPath[partsOfPath.length - 1];
		newImageFile.extensionName = extension;
		const path = newImageFile.Source.VaultPath + '/' + newImageFile.ID + '.' + extension;
		const normalizedPath = normalizePath(path);
		await inputForm.Source.vault.adapter.writeBinary(normalizedPath, await imageFile.arrayBuffer());
		const tFile = newImageFile.Source.vault.getFileByPath(newImageFile.Source.VaultPath + '/' + newImageFile.ID + '.md');
		if (tFile === null) {
			throw Error();
		}
		await newImageFile.Source.vault.append(tFile, FormattedFile.LAYER_SEPARATING_STRING + extension);
		return newImageFile;
	}

	static override async LoadLayer(source: Source, fileID: number, data: string[]): Promise<Image> {
		const imageFile = <Image> (await super.LoadLayer(source, fileID, data));
		
		const dataForLayer = FormattedFile.GetDataForLayer(data, Image.CLASS_DEPTH);
		imageFile.extensionName = dataForLayer[0];

		return imageFile;
	}

	static override async DisplayForLayer(imageToDisplay: Image, container: HTMLDivElement) {
		await super.DisplayForLayer(imageToDisplay, container);
		const imageDisplayContainer = container.createDiv('cfe-display-image');
		const imageElement = imageDisplayContainer.createEl('img');

		const imagePath = imageToDisplay.Source.VaultPath + '/' + imageToDisplay.ID + '.' + imageToDisplay.extensionName;
		const imageFile = imageToDisplay.Source.vault.getFileByPath(imagePath);
		if (imageFile === null) {
			throw Error('Image not found at path: ' + imagePath);
		}
		const arrayBuffer = await imageToDisplay.Source.vault.readBinary(imageFile);
		const blob = new Blob([arrayBuffer]);
		const imageUrl = URL.createObjectURL(blob);
		imageElement.src = imageUrl;
	}

	static override async SaveFileForLayer(tFile: TFile, imageToSave: Image) {
		await super.SaveFileForLayer(tFile, imageToSave);
		const dataForLayer = FormattedFile.LAYER_SEPARATING_STRING + imageToSave.extensionName;
		imageToSave.Source.vault.append(tFile, dataForLayer);
	}

	static override async CreateInputListForLayer(inputFormUI: FileCreatorUI) {
		await super.CreateInputListForLayer(inputFormUI);
		inputFormUI.InputLists.push(new FileCreatorInputList(inputFormUI.InputListsContainer));
		const inputList = inputFormUI.InputLists[Image.CLASS_DEPTH];
		inputList.SetFileType('Image');
		const imageFileInput = new FileCreatorInputField(inputList.listContainer.createDiv(), 'Image File');
		imageFileInput.inputs.push(imageFileInput.itemContainer.createEl('input', { type: 'file' } ));
		inputList.inputList.push(imageFileInput);
	}
}

export class Video extends FormattedFile {
	static CLASS_DEPTH = 1;

	extensionName: string;

	static override async CreateNewFileForLayer(inputForm: FileCreatorUI, unfinishedFile: FormattedFile): Promise<Video> {
		const newVideoFile = <Video> (await super.CreateNewFileForLayer(inputForm, unfinishedFile));
		const videoFileArray = inputForm.InputLists[Video.CLASS_DEPTH].inputList[0].inputs[0].files;
		if (videoFileArray === null) {
			throw Error("no file was selected");
		}
		const videoFile = videoFileArray[0];
		const partsOfPath = videoFile.name.split('.');
		const extension = partsOfPath[partsOfPath.length - 1];
		newVideoFile.extensionName = extension;
		const path = newVideoFile.Source.VaultPath + '/' + newVideoFile.ID + '.' + extension;
		const normalizedPath = normalizePath(path);
		await inputForm.Source.vault.adapter.writeBinary(normalizedPath, await videoFile.arrayBuffer());
		const tFile = newVideoFile.Source.vault.getFileByPath(newVideoFile.Source.VaultPath + '/' + newVideoFile.ID + '.md');
		if (tFile === null) {
			throw Error();
		}
		await newVideoFile.Source.vault.append(tFile, FormattedFile.LAYER_SEPARATING_STRING + extension);
		return newVideoFile;
	}

	static override async LoadLayer(source: Source, fileID: number, data: string[]): Promise<Video> {
		const videoFile = <Video> (await super.LoadLayer(source, fileID, data));
		
		const dataForLayer = FormattedFile.GetDataForLayer(data, Video.CLASS_DEPTH);
		videoFile.extensionName = dataForLayer[0];

		return videoFile;
	}

	static override async DisplayForLayer(videoToDisplay: Video, container: HTMLDivElement) {
		await super.DisplayForLayer(videoToDisplay, container);
		const videoDisplayContainer = container.createDiv('cfe-display-video');
		const videoElement = videoDisplayContainer.createEl('video');

		const videoPath = videoToDisplay.Source.VaultPath + '/' + videoToDisplay.ID + '.' + videoToDisplay.extensionName;
		const videoFile = videoToDisplay.Source.vault.getFileByPath(videoPath);
		if (videoFile === null) {
			throw Error('Video not found at path: ' + videoPath);
		}
		const arrayBuffer = await videoToDisplay.Source.vault.readBinary(videoFile);
		const blob = new Blob([arrayBuffer]);
		const videoUrl = URL.createObjectURL(blob);
		videoElement.src = videoUrl;
		videoElement.controls = true;
	}

	static override async SaveFileForLayer(tFile: TFile, videoToSave: Video) {
		await super.SaveFileForLayer(tFile, videoToSave);
		const dataForLayer = FormattedFile.LAYER_SEPARATING_STRING + videoToSave.extensionName;
		videoToSave.Source.vault.append(tFile, dataForLayer);
	}

	static override async CreateInputListForLayer(inputFormUI: FileCreatorUI) {
		await super.CreateInputListForLayer(inputFormUI);
		inputFormUI.InputLists.push(new FileCreatorInputList(inputFormUI.InputListsContainer));
		const inputList = inputFormUI.InputLists[Video.CLASS_DEPTH];
		inputList.SetFileType('Video');
		const videoFileInput = new FileCreatorInputField(inputList.listContainer.createDiv(), 'Video File');
		videoFileInput.inputs.push(videoFileInput.itemContainer.createEl('input', { type: 'file' } ));
		inputList.inputList.push(videoFileInput);
	}
}

export class Playlist extends FormattedFile {
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

	private static async loadNextVideo(playlist: Playlist, videoElement: HTMLVideoElement) {
		if (playlist.videoOrder === 'shuffled') {
			playlist.currentVideoIndex = Playlist.getNextVideoIDShuffled(playlist);
		} else {
			playlist.currentVideoIndex = Playlist.getNextVideoIDInOrder(playlist);
		}
		const nextVideo = <Video> (await FormattedFileHandler.LoadFile(playlist.Source, playlist.videoIDs[playlist.currentVideoIndex]));
		const nextVideoPath = playlist.Source.VaultPath + '/' + nextVideo.ID + '.' + nextVideo.extensionName;
		const nextVideoFile = playlist.Source.vault.getFileByPath(nextVideoPath);
		if (nextVideoFile === null) {
			throw Error('Video not found at path: ' + nextVideoPath);
		}
		const nextArrayBuffer = await playlist.Source.vault.readBinary(nextVideoFile);
		const nextBlob = new Blob([nextArrayBuffer]);
		const nextVideoUrl = URL.createObjectURL(nextBlob);
		videoElement.src = nextVideoUrl;
	}

	static override async CreateNewFileForLayer(inputForm: FileCreatorUI, unfinishedFile: FormattedFile): Promise<Playlist> {
		const newPlaylistFile = <Playlist> (await super.CreateNewFileForLayer(inputForm, unfinishedFile));
		newPlaylistFile.videoIDs = [];
		const inputListForLayer = inputForm.InputLists[Playlist.CLASS_DEPTH];
		const inputtedVideoIDs = inputListForLayer.inputList[0].inputs;
		const numVideos = inputtedVideoIDs.length;
		const filePath = newPlaylistFile.Source.VaultPath + '/' + newPlaylistFile.ID + '.md';
		let dataForLayer = FormattedFile.LAYER_SEPARATING_STRING;
		for (let i = 0; i < numVideos; i++) {
			const videoID = parseInt(inputtedVideoIDs[i].value);
			newPlaylistFile.videoIDs.push(videoID);
			dataForLayer += '' + videoID + '\n';
		}
		const tFile = newPlaylistFile.Source.vault.getFileByPath(filePath);
		if (tFile === null) {
			throw Error();
		}
		newPlaylistFile.Source.vault.append(tFile, dataForLayer);
		return newPlaylistFile;
	}

	static override async LoadLayer(source: Source, fileID: number, data: string[]): Promise<Playlist> {
		const playlistFile = <Playlist> (await super.LoadLayer(source, fileID, data));
		
		playlistFile.videoIDs = [];
		const dataForLayer = FormattedFile.GetDataForLayer(data, Playlist.CLASS_DEPTH);
		for (let i = 0; i < dataForLayer.length; i++) {
			const videoID = parseInt(dataForLayer[i]);
			playlistFile.videoIDs.push(videoID);
		}

		return playlistFile;
	}

	static override async DisplayForLayer(playlistToDisplay: Playlist, container: HTMLDivElement) {
		await super.DisplayForLayer(playlistToDisplay, container);
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
			await Playlist.loadNextVideo(playlistToDisplay, videoElement);
		}

		const firstVideo = <Video> (await FormattedFileHandler.LoadFile(playlistToDisplay.Source, playlistToDisplay.videoIDs[playlistToDisplay.currentVideoIndex]));
		const videoPath = playlistToDisplay.Source.VaultPath + '/' + firstVideo.ID + '.' + firstVideo.extensionName;
		const videoFile = playlistToDisplay.Source.vault.getFileByPath(videoPath);
		if (videoFile === null) {
			throw Error('Video not found at path: ' + videoPath);
		}
		const arrayBuffer = await playlistToDisplay.Source.vault.readBinary(videoFile);
		const blob = new Blob([arrayBuffer]);
		const videoUrl = URL.createObjectURL(blob);
		videoElement.src = videoUrl;
		videoElement.autoplay = true;
		videoElement.controls = true;
		videoElement.ontimeupdate = async () => {
			if (videoElement.ended) {
				await Playlist.loadNextVideo(playlistToDisplay, videoElement);
			}
		}
	}

	static override async SaveFileForLayer(tFile: TFile, playlistToSave: Playlist) {
		await super.SaveFileForLayer(tFile, playlistToSave);
		let dataForLayer = FormattedFile.LAYER_SEPARATING_STRING;

		for (let i = 0; i < playlistToSave.videoIDs.length; i++) {
			dataForLayer += '' + playlistToSave.videoIDs[i] + '\n';
		}

		playlistToSave.Source.vault.append(tFile, dataForLayer);
	}

	static override async CreateInputListForLayer(inputFormUI: FileCreatorUI) {
		await super.CreateInputListForLayer(inputFormUI);
		inputFormUI.InputLists.push(new FileCreatorInputList(inputFormUI.InputListsContainer));
		const inputList = inputFormUI.InputLists[Playlist.CLASS_DEPTH];
		inputList.SetFileType('Playlist');
		const videoFileInput = new FileCreatorInputField(inputList.listContainer.createDiv(), 'Videos');
		const buttonsContainer = videoFileInput.itemContainer.createDiv('hbox');
		const addButton = buttonsContainer.createEl('button', { text: 'Add Video' } );
		addButton.onclick = () => {
			videoFileInput.inputs.push(videoFileInput.itemContainer.createEl('input', { type: 'text' } ));
			inputList.inputList.push(videoFileInput);
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
