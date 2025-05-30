import { normalizePath, Notice, Vault } from "obsidian";
import { Source } from "./source";
import { Folder } from "./folder";

/**
 * An interpretation of specific markdown files (could switch to json in the future)
 * as "file formats" that can be interpreted and displayed by the plugin.
 */
export abstract class FileFormat {
	/**
	 * A reference to the path to the source folder, a count of the total number of files, and the main div for display.
	 */
	Source: Source;

	/**
	 * The ID of the parent folder
	 */
	ParentFolderID: number;

	/**
	 * A unique (within the "source" of the current explorer) numerical identifier for the file
	 */
	ID: number;
	
	/**
	 * The type of file
	 */
	FileType: string;

	static KnownFileTypes: string[] = [
		'Folder'
	]

	/**
	 * The name of the file within the source
	 */
	FileName: string;
	
	/**
	 * Only use the constructor if this file does not exist yet, or if you are using it in a child constructor.
	 * Otherwise, use the static method LoadData
	 * @param source 
	 * @param fileName 
	 */
	constructor(source: Source, fileName: string) {
		this.Source = source;
		this.FileName = fileName;
		this.ID = -1;
	}

	/**
	 * Creates a FileFormat object from the data from an existing file.
	 * Child classes should NOT override this method.
	 * Instead, override LoadDataFromText in the child class and then add
	 * the file type to the LoadCorrectFileType method in this class.
	 * @param source the source to load the file from
	 * @param vault the obsidian vault
	 * @param fileID the ID of the existing file within the source
	 */
	static async LoadData(source: Source, vault: Vault, fileID: number): Promise<FileFormat | null> {
		const data = await source.GetFileDataByID(vault, fileID);
		if (data === null) {
			return null;
		}
		const fileType = data[0];
		return await FileFormat.LoadCorrectFileType(source, vault, fileID, data, fileType);
	}

	/**
	 * Determines the filetype and calls the appropriate method to create and return a FileFormat object.
	 * Child classes should NOT override this method.
	 * @param source the source to load the file from
	 * @param vault the obsidian vault
	 * @param fileID the ID of the existing file within the source
	 */
	static async LoadCorrectFileType(source: Source, vault: Vault, fileID: number, data: string[], fileType: string): Promise<FileFormat | null> {
		switch (fileType) {
			case 'Folder':
				return await Folder.LoadDataFromText(source, vault, data, fileID);
			default:
				return null;
		}
	}

	/**
	 * To be implemented by a child class.
	 * Each child class expects the file to be in its own custom format.
	 * If left unimplemented, this simply returns null.
	 * @param source the source to load the file from
	 * @param vault the obsidian vault
	 * @param fileID the ID of the existing file within the source
	 * @returns a reference to an object representing the file
	 */
	static async LoadDataFromText(source: Source, vault: Vault, data: string[], fileID: number): Promise<FileFormat | null> {
		return null;
	}

	/**
	 * Loads a thumbnail for the file within the div given. If not defined, this method simply gives the div the "thumbnail" css class
	 * @param container - The div allocated for the thumbnail. This div is given the "thumbnail" class for css styling.
	 * @param vault - the obsidian vault
	 */
	async DisplayThumbnail(thumbnailContainer: HTMLDivElement, displayContainer: HTMLDivElement, vault: Vault) {
		thumbnailContainer.className = 'thumbnail';
		thumbnailContainer.onclick = async () => {
			await this.Display(displayContainer, vault);
		}
	}
	
	/**
	 * Displays this file within the div given. If not defined, this method simply empties the div.
	 * @param container - the div allocated for the display
	 * @param vault - the obsidian vault
	 */
	async Display(container: HTMLDivElement, vault: Vault) {
		container.empty();
	}

	/**
	 * Empties and resaves the file's contents to its md file.
	 * If not defined further, it creates the file if it doesn't exist yet and saves the file type and file name.
	 * @param vault - the obsidian vault
	 */
	async SaveFile(vault: Vault) {
		// Save this file to the source list
		if (this.ID === -1) {
			this.ID = this.Source.FileCount;
			this.Source.FileCount++;
			await this.Source.Save(vault);
		}

		// Find the file and check that it isn't null
		const tFile = vault.getFileByPath(this.Source.VaultPath + '/' + this.ID);
		if (tFile === null) {
			new Notice("File could not be found at the path: " + this.Source.VaultPath + '\n' + this.ID);
			return;
		}

		// Empty the file
		await vault.modify(tFile, '');

		// Save the contents
		const normalizedPath = normalizePath(this.Source.VaultPath + '/source.md');
		await vault.adapter.write(normalizedPath, this.FileType + '\n' + this.FileName);
	}
}
