import { Notice, Vault } from "obsidian";
import { FileFormat } from "./file-format";
import { Source } from "./source";

export class Folder extends FileFormat {
	FileType = "Folder";

	/**
	 * The IDs of files contained in this folder
	 */
	ContainedFileIDs: number[];

	constructor(source: Source, fileName: string, parentFolderID: number) {
		super(source, fileName);
		this.ParentFolderID = parentFolderID;
		this.ContainedFileIDs = [];
	}

	static override async LoadDataFromText(source: Source, vault: Vault, data: string[], fileID: number): Promise<FileFormat | null> {
		const newFolder = new Folder(source, data[1], parseInt(data[2]));
		for (let i = 3; i < data.length; i++) {
			newFolder.ContainedFileIDs.push(parseInt(data[i]));
		}
		return newFolder;
	}

	/**
	 * Loads a thumbnail for the folder within the div given. The thumbnail is just the folder name.
	 * @param container - The div allocated for the thumbnail. This div is given the "thumbnail" class for css styling.
	 * @param vault - the obsidian vault
	 */
	override async DisplayThumbnail(thumbnailContainer: HTMLDivElement, displayContainer: HTMLDivElement, vault: Vault) {
		super.DisplayThumbnail(thumbnailContainer, displayContainer, vault);
		thumbnailContainer.createEl('p', { text: this.FileName } ).className = "thumbnail-folder-name";
	}

	/**
	 * Displays this folder within the div given. It loads the thumbnails for all the files inside it.
	 * @param container - the div allocated for the display
	 * @param vault - the obsidian vault
	 */
	override async Display(container: HTMLDivElement, vault: Vault) {
		await super.Display(container, vault);
		const folderDisplayContainer = container.createDiv('display-folder');
		// const headerContainer = folderDisplayContainer.createDiv('display-folder-header');
		// headerContainer.createEl('input', { type: 'text' } );
		// headerContainer.createEl('button').onclick = 
		for (let i = 0; i < this.ContainedFileIDs.length; i++) {
			const containedFile = await FileFormat.LoadData(this.Source, vault, this.ContainedFileIDs[i]);
			if (containedFile) {
				containedFile.DisplayThumbnail(folderDisplayContainer.createDiv(), container, vault);
			}
		}
	}

	/**
	 * Saves the folder's name, parent folder ID, and stored file IDs
	 * @param vault the obsidian vault
	 */
	override async SaveFile(vault: Vault) {
		await super.SaveFile(vault);
		// Find the file and check that it isn't null
		const tFile = vault.getFileByPath(this.Source.VaultPath + '/' + this.ID + '.md');
		if (tFile === null) {
			new Notice("Folder could not be found at the path: " + this.Source.VaultPath + '\n' + this.ID);
			return;
		}
		let newData = '' + this.ParentFolderID + '\n';
		for (let i = 0; i < this.ContainedFileIDs.length; i++) {
			newData += this.ContainedFileIDs[i] + '\n';
		}
		vault.append(tFile, newData);
	}
}
