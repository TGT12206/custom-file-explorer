import { normalizePath, Notice, TFile, Vault } from "obsidian";

//#region Source
/**
 * A representation of the source (similar to a vault). Contains a reference to the vault path and file count.
 */
export class SourceFolder {
	vaultPath: string;
	fileCount: number;

	private constructor() {
		this.vaultPath = '';
		this.fileCount = 0;
	}

	async Display(container: HTMLDivElement, vault: Vault) {
		const snv = new SourceAndVault(this, vault);
		let rootFolder;
		try {
			rootFolder = await CFEFileHandler.LoadFile(snv, 0);
		} catch (e) {
			const newRootFolderData = new FileCreationData(snv, 'Folder', 0);
			rootFolder = await CFEFileHandler.CreateNew(newRootFolderData);
		}
		await SourceFolder.Save(snv);
		await rootFolder.Save(snv);
		await rootFolder.Display(snv, container);
	}

	static async CreateOrLoadSourceFolder(vaultPath: string, vault: Vault): Promise<SourceFolder> {
		vaultPath = vaultPath.endsWith('/source.json') ? vaultPath.slice(0, -12) : vaultPath;
		const exists = vault.getFileByPath(vaultPath + '/source.json') !== null;
		let newSourceFolder: SourceFolder;
		if (exists) {
			newSourceFolder = await this.LoadExistingSource(vaultPath, vault);
		} else {
			newSourceFolder = await this.CreateNewSourceFolder(vaultPath, vault);
		}
		return newSourceFolder;
	}

	private static async CreateNewSourceFolder(vaultPath: string, vault: Vault): Promise<SourceFolder> {
		const newSourceFolder = new SourceFolder();
		newSourceFolder.vaultPath = vaultPath;
		newSourceFolder.fileCount = 0;
		try {
			await vault.createFolder(vaultPath);
		} finally {
			const sourcePath = normalizePath(vaultPath + '/source.json');
			await vault.adapter.write(sourcePath, '0');
		}
		return newSourceFolder;
	}

	private static async LoadExistingSource(vaultPath: string, vault: Vault): Promise<SourceFolder> {
		const sourceTFile = vault.getFileByPath(vaultPath + '/source.json');
		if (sourceTFile === null) {
			new Notice("Source File could not be found at the path: " + vaultPath + '/source.json');
			throw Error("Source File could not be found at the path: " + vaultPath + '/source.json');
		}
		const jsonData = await vault.cachedRead(sourceTFile);

		const plainObject = await JSON.parse(jsonData);
		const newSourceFolder = Object.assign(new SourceFolder(), plainObject);
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
export class FileCreationData {
	snv: SourceAndVault;
	fileType: string;
	parentFolderID: number;
	constructor(snv: SourceAndVault, fileType: string, parentFolderID: number) {
		this.snv = snv;
		this.fileType = fileType;
		this.parentFolderID = parentFolderID;
	}
}
//#endregion

//#region Formatted File Handler
export class CFEFileHandler {

	/**
	 * All of the known file formats
	 */
	static KnownFileTypes: string[] = [
		'Folder',
		'Single Media File',
		'Variant Media File',
		'Playlist'
	]

	static async CreateNew(data: FileCreationData): Promise<CFEFile> {
		let newFile: CFEFile;
		switch(data.fileType) {
			case 'Folder':
			default:
				newFile = await Folder.CreateNewFileForLayer(data);
				break;
			case 'Single Media File':
				newFile = await SingleMediaFile.CreateNewFileForLayer(data);
				break;
			case 'Variant Media File':
				newFile = await VariantMediaFile.CreateNewFileForLayer(data);
				break;
			case 'Playlist':
				newFile = await Playlist.CreateNewFileForLayer(data);
				break;
		}
		await newFile.Save(data.snv);
		return newFile;
	}

	static async LoadFile(snv: SourceAndVault, fileID: number): Promise<CFEFile> {
		const sourceFolder = snv.sourceFolder;
		const vault = snv.vault;

		const tFile = vault.getFileByPath(sourceFolder.vaultPath + '/' + fileID + '.json');
		if (tFile === null) {
			new Notice("File could not be found at the path: " + sourceFolder.vaultPath + '/' + fileID + '.json');
			throw Error("File could not be found at the path: " + sourceFolder.vaultPath + '/' + fileID + '.json');
		}
		const jsonData = await vault.cachedRead(tFile);
		const plainObject = JSON.parse(jsonData);
		switch(plainObject.fileType) {
			case 'Folder':
			default:
				return Object.assign(new Folder(), plainObject);
			case 'Single Media File':
				return Object.assign(new SingleMediaFile(), plainObject);
			case 'Variant Media File':
				return Object.assign(new VariantMediaFile(), plainObject);
			case 'Playlist':
				return Object.assign(new Playlist(), plainObject);
		}
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
	 * SHOULD NOT BE CALLED OUTSIDE OF CFEFileHandler.
	 * 
	 * Use CFEFileHandler.CreateNew() instead.
	 * 
	 * CHILD CLASSES SHOULD NOT WRITE TO A FILE. THIS IS DONE INSIDE OF CFEFileHandler
	 * 
	 * CFEFile layer:
	 * 
	 * sets the source, id, file type, file name, and parent folder id of the file object.
	 */
	static async CreateNewFileForLayer(data: FileCreationData): Promise<CFEFile> {
		const sourceAndVault = data.snv;
		const sourceFolder = sourceAndVault.sourceFolder;

		// Set the values of the unfinished file
		const unfinishedFile = new CFEFile();
		unfinishedFile.id = sourceFolder.fileCount;
		unfinishedFile.fileType = data.fileType;
		unfinishedFile.fileName = '';
		unfinishedFile.parentFolderID = data.parentFolderID;
		
		// Update the file count
		sourceFolder.fileCount++;
		await SourceFolder.Save(sourceAndVault);

		// Find the parent folder and add this file to it
		if (unfinishedFile.id !== unfinishedFile.parentFolderID) {
			const parentFolder = <Folder> (await CFEFileHandler.LoadFile(sourceAndVault, unfinishedFile.parentFolderID));
			parentFolder.containedFileIDs.push(unfinishedFile.id);
			await parentFolder.Save(sourceAndVault);
		}

		// Return the unfinished file so the next layer can add to it
		return unfinishedFile;
	}

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF CFEFileHandler.
	 * 
	 * Use CFEFileHandler.DisplayThumbnail() instead.
	 * 
	 * CFEFile layer:
	 * 
	 * sets the thumbnail container's css class to 'cfe-thumbnail'
	 * and fully displays the file if the thumbnail is clicked.
	 */
	async DisplayThumbnail(sourceAndVault: SourceAndVault, thumbnailDiv: HTMLDivElement, displayDiv: HTMLDivElement) {
		thumbnailDiv.className = 'cfe-thumbnail vbox';
		thumbnailDiv.onclick = async () => {
			await this.Display(sourceAndVault, displayDiv);
		}
		const idText = thumbnailDiv.createDiv('hbox');
		idText.textContent = 'ID: ' + this.id;
		idText.style.justifyContent = 'center';
		const fileText = thumbnailDiv.createDiv('hbox');
		fileText.textContent = 'File Type: ' + this.fileType;
		fileText.style.justifyContent = 'center';
		const nameText = thumbnailDiv.createDiv('hbox');
		nameText.textContent = 'File Name: ' + this.fileName;
		nameText.style.justifyContent = 'center';
	}
	
	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF CFEFileHandler.
	 * 
	 * Use CFEFileHandler.Display() instead.
	 * 
	 * CFEFile layer:
	 * 
	 * empties the display container provided.
	 */
	async Display(snv: SourceAndVault, container: HTMLDivElement) {
		container.empty();
		const headerContainer = container.createDiv('hbox');
		const backButton = headerContainer.createEl('button', { text: 'Back to parent folder' } );
		headerContainer.createEl('p', { text: 'File ID: ' + this.id } )
		headerContainer.createEl('p', { text: 'File Name: ' } )
		const nameInput = headerContainer.createEl('input', { type: 'text', value: this.fileName } );
		backButton.onclick = async () => {
			const parentFolder = await CFEFileHandler.LoadFile(snv, this.parentFolderID);
			if (parentFolder !== null) {
				await parentFolder.Display(snv, container);
			}
		}
		nameInput.onchange = async () => {
			this.fileName = nameInput.value;
			await this.Save(snv);
		}
	}

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF CFEFileHandler.
	 * 
	 * (it is unlikely this method will ever be overriden by child classes, but making this 'inaccessible' is for consistency)
	 * 
	 * Use CFEFileHandler.SaveFile() instead.
	 * 
	 * Formatted File layer:
	 * 
	 * Deletes this file ID from the original parent folder, adds this file to the new parent folder, and changes the parent folder ID
	 */
	async MoveFile(sourceAndVault: SourceAndVault, newParentFolderID: number) {
		// Delete this file id from the original parent folder
		const oldParentFolder = <Folder> (await CFEFileHandler.LoadFile(sourceAndVault, this.parentFolderID));
		const indexOfFile = oldParentFolder.containedFileIDs.indexOf(this.id);
		oldParentFolder.containedFileIDs.splice(indexOfFile, 1);
		oldParentFolder.Save(sourceAndVault); // this can be done asynchronously without affecting the others

		// Add this file to the new parent folder
		const newParentFolder = <Folder> (await CFEFileHandler.LoadFile(sourceAndVault, newParentFolderID));
		newParentFolder.containedFileIDs.push(this.id);
		newParentFolder.Save(sourceAndVault); // this can be done asynchronously without affecting the others

		this.parentFolderID = newParentFolderID;
		this.Save(sourceAndVault); // this can be done asynchronously without affecting the others
	}

	async Save(sourceAndVault: SourceAndVault) {
		const sourceFolder = sourceAndVault.sourceFolder;
		const vault = sourceAndVault.vault;
		const filePath = sourceFolder.vaultPath + '/' + this.id + '.json';
		const jsonData = JSON.stringify(this);
		const tFile = vault.getFileByPath(filePath);
		if (tFile === null) {
			const normalizedPath = normalizePath(filePath);
			await vault.adapter.write(normalizedPath, jsonData);
			return;
		}
		await vault.modify(tFile, jsonData);
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
	static override async CreateNewFileForLayer(data: FileCreationData): Promise<Folder> {
		const unfinishedFolder = <Folder> (await super.CreateNewFileForLayer(data));
		unfinishedFolder.containedFileIDs = [];
		return unfinishedFolder;
	}

	override async Display(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		await super.Display(snv, mainDiv);
		const createButtonsDiv = mainDiv.createDiv('hbox');
		const newFileButton = createButtonsDiv.createEl('button', { text: 'Create New File' } );
		newFileButton.onclick = () => {
			this.LoadCreateFileUI(snv, mainDiv);
		}
		const mediaFilesButton = createButtonsDiv.createEl('button', { text: 'Upload Multiple Images / Videos' } );
		mediaFilesButton.onclick = () => {
			this.LoadFileSelectionUI(snv, mainDiv);
		}
		const folderDisplayContainer = mainDiv.createDiv('cfe-grid');
		for (let i = 0; i < this.containedFileIDs.length; i++) {
			const containedFile = await CFEFileHandler.LoadFile(snv, this.containedFileIDs[i]);
			if (containedFile !== null) {
				await containedFile.DisplayThumbnail(snv, folderDisplayContainer.createDiv(), mainDiv);
			}
		}
	}
	
	private LoadCreateFileUI(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		const data = new FileCreationData(snv, 'Folder', 0);
		const popUpContainer = mainDiv.createDiv('vbox cfe-popup');
		popUpContainer.createEl('p', { text: 'Choose a File Type to create: ' } );
		const fileTypeDropdown = popUpContainer.createEl('select');
		popUpContainer.createEl('p', { text: 'Parent Folder ID: ' } );
		const parentFolderIDInput = popUpContainer.createEl('input', { type: 'text', value: '' + this.id } );
		for (let i = 0; i < CFEFileHandler.KnownFileTypes.length; i++) {
			const option = fileTypeDropdown.createEl('option');
			option.value = CFEFileHandler.KnownFileTypes[i];
			option.text = CFEFileHandler.KnownFileTypes[i];
			fileTypeDropdown.options.add(option);
		}
		const exitButton = popUpContainer.createEl('button', { text: 'X', cls: 'cfe-exit-button' } );
		exitButton.onclick = () => {
			popUpContainer.remove();
		}
		const submitButton = popUpContainer.createEl('button', { text: 'Create' } );
		submitButton.onclick = async () => {
			data.fileType = fileTypeDropdown.value;
			data.parentFolderID = parseInt(parentFolderIDInput.value);
			await CFEFileHandler.CreateNew(data);
			exitButton.click();
			const resettedFolder = await CFEFileHandler.LoadFile(snv, this.id);
			await resettedFolder.Display(snv, mainDiv);
		}
	}

	private LoadFileSelectionUI(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		const popUpContainer = mainDiv.createDiv('vbox cfe-popup');
		popUpContainer.createEl('p', { text: 'Choose your files' } );
		const fileInput = popUpContainer.createEl('input', { type: 'file' } );
		fileInput.multiple = true;
		popUpContainer.createEl('p', { text: 'Parent Folder ID: ' } );
		const parentFolderIDInput = popUpContainer.createEl('input', { type: 'text', value: '' + this.id } );
		const exitButton = popUpContainer.createEl('button', { text: 'X', cls: 'cfe-exit-button' } );
		exitButton.onclick = () => {
			popUpContainer.remove();
		}
		const submitButton = popUpContainer.createEl('button', { text: 'Create' } );
		submitButton.onclick = async () => {
			const fileArray = fileInput.files;
			const parentFolderID = parseInt(parentFolderIDInput.value);
			if (fileArray !== null) {
				for (let i = 0; i < fileArray.length; i++) {
					const data = new FileCreationData(snv, 'Single Media File', parentFolderID);
					const cfeFile = await CFEFileHandler.CreateNew(data);
					const mediaFile = Object.assign(new SingleMediaFile(), cfeFile);
					await mediaFile.SetFileTo(snv, fileArray[i]);
					await mediaFile.Save(snv);
					console.log('i: ' + i + ' length: ' + this.containedFileIDs.length);
				}
				exitButton.click();
				const resettedFolder = await CFEFileHandler.LoadFile(snv, this.id);
				await resettedFolder.Display(snv, mainDiv);
			}
		}
	}
}

export abstract class RealFile extends CFEFile {
	static CLASS_DEPTH = 1;
	fileType = 'Real File';

	abstract getSrc(sourceAndVault: SourceAndVault): Promise<string>;
	async DisplayMediaOnly(mediaDiv: HTMLDivElement, snv: SourceAndVault) {
		mediaDiv.empty();
	}
}

export class SingleMediaFile extends RealFile {
	static CLASS_DEPTH = 2;

	fileType = 'Single Media File';

	private extensionName: string;

	get mediaType(): string {
		switch (this.extensionName) {
			case 'png':
			case 'jpg':
			case 'webp':
			case 'heic':
			case 'gif':
				return 'Image';
			case 'mp4':
			case 'MP4':
			case 'mov':
			case 'MOV':
			default:
				return 'Video';
		}
	}

	override async getSrc(snv: SourceAndVault): Promise<string> {
		const mediaFile = await this.getTFile(snv);
		const arrayBuffer = await snv.vault.readBinary(mediaFile);
		const blob = new Blob([arrayBuffer]);
		const mediaUrl = URL.createObjectURL(blob);
		return mediaUrl;
	}

	private async getTFile(snv: SourceAndVault): Promise<TFile> {
		const mediaPath = await this.getPath(snv);
		const mediaFile = snv.vault.getFileByPath(mediaPath);
		if (mediaFile === null) {
			throw Error('Image not found at path: ' + mediaPath);
		}
		return mediaFile;
	}

	private async getPath(snv: SourceAndVault): Promise<string> {
		const sourceFolder = snv.sourceFolder;
		return sourceFolder.vaultPath + '/' + this.id + ' Actual File.' + this.extensionName;
	}

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<SingleMediaFile> {
		const newMediaFile = <SingleMediaFile> (await super.CreateNewFileForLayer(data));
		newMediaFile.extensionName = '';
		return newMediaFile;
	}

	override async Display(snv: SourceAndVault, container: HTMLDivElement) {
		await super.Display(snv, container);

		const imageDisplayContainer = container.createDiv('vbox');
		imageDisplayContainer.createEl('p', { text: 'Change file' } );
		const newFileInput = imageDisplayContainer.createEl('input', { type: 'file' } );

		await this.DisplayMediaOnly(imageDisplayContainer, snv);
		
		newFileInput.onchange = async () => {
			try {
				const oldFile = await this.getTFile(snv);
				try {
					await snv.vault.delete(oldFile);
				} finally {
					await this.SaveNewFile(snv, newFileInput);
					this.Display(snv, container);
				}
			} catch {
				console.log();
			}
		}
	}

	private async SaveNewFile(snv: SourceAndVault, fileInput: HTMLInputElement) {
		const fileArray = fileInput.files;
		if (fileArray === null) {
			throw Error("no file was selected");
		}
		const mediaFile = fileArray[0];
		await this.SetFileTo(snv, mediaFile);
	}

	async SetFileTo(snv: SourceAndVault, mediaFile: File) {
		const partsOfPath = mediaFile.name.split('.');
		const extension = partsOfPath[partsOfPath.length - 1];
		this.fileName = partsOfPath[0];
		this.extensionName = extension;
		const path = snv.sourceFolder.vaultPath + '/' + this.id + ' Actual File.' + extension;
		const normalizedPath = normalizePath(path);
		await snv.vault.adapter.writeBinary(normalizedPath, await mediaFile.arrayBuffer());
		await this.Save(snv);
	}

	override async DisplayMediaOnly(mediaDiv: HTMLDivElement, snv: SourceAndVault) {
		await super.DisplayMediaOnly(mediaDiv, snv);
		if (this.mediaType === 'Image') {
			const imageElement = mediaDiv.createEl('img');
			imageElement.src = await this.getSrc(snv);
		} else {
			const videoElement = mediaDiv.createEl('video');
			videoElement.src = await this.getSrc(snv);
			videoElement.controls = true;
			videoElement.loop = true;
			videoElement.autoplay = true;
		}
	}
}

export class VariantMediaFile extends RealFile {
	static CLASS_DEPTH = 2;

	fileType = 'Variant Media File';

	private variantIDs: number[];

	async getSrc(snv: SourceAndVault, index: number | null = null): Promise<string> {
		if (index === null) {
			index = Math.floor((Math.random()) * this.variantIDs.length);
		}
		const containedMedia = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, this.variantIDs[index]);
		return await containedMedia.getSrc(snv);
	}

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<VariantMediaFile> {
		const newMediaFile = <VariantMediaFile> (await super.CreateNewFileForLayer(data));
		newMediaFile.variantIDs = [];
		return newMediaFile;
	}

	override async Display(snv: SourceAndVault, container: HTMLDivElement) {
		await super.Display(snv, container);

		const imageDisplayContainer = container.createDiv('vbox');
		imageDisplayContainer.createEl('p', { text: 'Change files' } );
		const mediaIDInputDiv = imageDisplayContainer.createDiv('vbox');
		const newFileButton = imageDisplayContainer.createEl('button', { text: 'Add File' } );
		for (let i = 0; i < this.variantIDs.length; i++) {
			const currentIndex = i;
			const mediaIDDiv = mediaIDInputDiv.createDiv('hbox');
			const idInput = mediaIDDiv.createEl('input', { type: 'text', value: '' + this.variantIDs[currentIndex] } );
			const deleteButton = mediaIDDiv.createEl('button', { text: 'delete' } );
			deleteButton.className = 'cfe-remove-button';
			deleteButton.onclick = async () => {
				mediaIDDiv.remove();
				this.variantIDs.splice(currentIndex, 1);
				await this.Save(snv);
				await this.Display(snv, container);
			}
			idInput.onchange = async () => {
				this.variantIDs[currentIndex] = parseInt(idInput.value);
				await this.Save(snv);
				await this.Display(snv, container);
			}
		}
		newFileButton.onclick = async () => {
			this.variantIDs.push(-1);
			await this.Save(snv);
			await this.Display(snv, container);
		}
		const mediaDiv = imageDisplayContainer.createDiv('vbox');
		
		await this.DisplayMediaOnly(mediaDiv, snv);
	}
	async DisplayMediaOnly(mediaDiv: HTMLDivElement, snv: SourceAndVault, index = -1) {
		// This call is not needed because containedMedia.DisplayMediaOnly calls it anyway
		// await super.DisplayMediaOnly(mediaDiv, snv);
		if (index === -1) {
			index = Math.floor((Math.random()) * this.variantIDs.length);
		}
		const containedMedia = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, this.variantIDs[index]);
		await containedMedia.DisplayMediaOnly(mediaDiv, snv);
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
		if (playlist.videoOrder === 'shuffled') {
			playlist.currentVideoIndex = Playlist.getNextVideoIDShuffled(playlist);
		} else {
			playlist.currentVideoIndex = Playlist.getNextVideoIDInOrder(playlist);
		}
		const nextVideo = <RealFile> (await CFEFileHandler.LoadFile(sourceAndVault, playlist.videoIDs[playlist.currentVideoIndex]));

		videoElement.src = await nextVideo.getSrc(sourceAndVault);
	}

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<Playlist> {
		const newPlaylistFile = <Playlist> (await super.CreateNewFileForLayer(data));
		newPlaylistFile.videoIDs = [];
		return newPlaylistFile;
	}

	override async Display(snv: SourceAndVault, container: HTMLDivElement) {
		await super.Display(snv, container);
		this.currentVideoIndex = 0;
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
		this.videoOrder = 'in order';
		shuffleButton.onclick = () => {
			if (shuffleButton.textContent === 'shuffle') {
				shuffleButton.textContent = 'go in order';
				this.videoOrder = 'shuffled';
			} else {
				shuffleButton.textContent = 'shuffle';
				this.videoOrder = 'in order';
			}
		}
		const nextButton = buttonsContainer.createEl('button', { text: 'next video' } );
		nextButton.onclick = async () => {
			await Playlist.loadNextVideo(snv, this, videoElement);
		}

		try {
			const firstVideo = <RealFile> (await CFEFileHandler.LoadFile(snv, this.videoIDs[this.currentVideoIndex]));
			videoElement.src = await firstVideo.getSrc(snv);
			videoElement.autoplay = true;
			videoElement.controls = true;
			videoElement.ontimeupdate = async () => {
				if (videoElement.ended) {
					await Playlist.loadNextVideo(snv, this, videoElement);
				}
			}
		} finally {
			container.createEl('p', { text: 'Change files' } );
			let count = 0;
			const mediaIDInputDiv = container.createDiv('vbox');
			const newFileButton = container.createEl('button', { text: 'Add File' } );
			for (let i = 0; i < this.videoIDs.length; i++) {
				const currentIndex = count;
				count++;
				const mediaIDDiv = mediaIDInputDiv.createDiv('hbox');
				const idInput = mediaIDDiv.createEl('input', { type: 'text', value: '' + this.videoIDs[currentIndex] } );
				const deleteButton = mediaIDDiv.createEl('button', { text: 'delete' } );
				deleteButton.onclick = () => {
					mediaIDDiv.remove();
					this.videoIDs.splice(currentIndex, 1);
					this.Display(snv, container);
				}
				idInput.onchange = () => {
					this.videoIDs[currentIndex] = parseInt(idInput.value);
					this.Save(snv);
				}
			}
			newFileButton.onclick = () => {
				const currentIndex = count;
				count++;
				const mediaIDDiv = mediaIDInputDiv.createDiv('hbox');
				const idInput = mediaIDDiv.createEl('input', { type: 'text' } );
				const deleteButton = mediaIDDiv.createEl('button', { text: 'delete' } );
				deleteButton.onclick = () => {
					mediaIDDiv.remove();
					this.videoIDs.splice(currentIndex, 1);
					this.Display(snv, container);
				}
				idInput.onchange = () => {
					this.videoIDs[currentIndex] = parseInt(idInput.value);
					this.Save(snv);
				}
			}
		}
	}
}
//#endregion
