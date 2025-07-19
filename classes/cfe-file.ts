import { normalizePath } from "obsidian";
import { SourceAndVault } from "./snv";
import { FileCreationData } from "./file-creation-data";
import { CFEFileHandler } from "./cfe-file-handler";
import { SourceFolder } from "./source-folder";
import { Folder } from "./folder";

//#region Formatted File Handler
//#endregion

//#region File Types
/**
 * An interpretation of json files as a "file" of a specific "file format"
 * that can be interpreted and displayed by the plugin.
 */
export class CFEFile {
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
