import { normalizePath, Notice, TFile } from "obsidian";
import { Source } from "../source";
import { FormattedFileHandler } from "./formatted-file-handler";
import { Folder } from "./folder";

/**
 * An interpretation of specific markdown files (could switch to json in the future)
 * as "file formats" that can be interpreted and displayed by the plugin.
 */
export class FormattedFile {
	
	static CLASS_DEPTH = 0;

	static readonly LAYER_SEPERATING_STRING = '-=-=-=-\n';

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
		'Base File Type',
		'Folder'
	]

	/**
	 * The name of the file within the source
	 */
	FileName: string;

	/**
	 * The ID of the parent folder
	 */
	ParentFolderID: number;

	/**
	 * SHOULD NOT BE CALLED OUTSIDE OF FormattedFileHandler.
	 * 
	 * Use FormattedFileHandler.CreateNew() instead.
	 * 
	 * FormattedFile layer:
	 * 
	 * sets the source, id, file type, file name, and parent folder id of the file object.
	 */
	static async CreateNewFileForLayer(inputFields: BaseFileCreatorInputForm, unfinishedFile: FormattedFile): Promise<FormattedFile> {
		// Set the values of the unfinished file
		unfinishedFile.Source = inputFields.Source;
		unfinishedFile.ID = unfinishedFile.Source.FileCount;
		unfinishedFile.FileType = inputFields.SelectedFileType;
		unfinishedFile.FileName = inputFields.FileName();
		unfinishedFile.ParentFolderID = inputFields.ParentFolderID();

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
		let dataToSave = '';
		dataToSave += unfinishedFile.FileType + '\n';
		dataToSave += inputFields.FileName() + '\n';
		dataToSave += inputFields.ParentFolderID() + '\n';
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
			new Notice("File could not be found at the path: " + source.VaultPath + '\n' + fileID);
			throw Error("File could not be found at the path: " + source.VaultPath + '\n' + fileID);
		}

		return (await source.vault.cachedRead(tFile)).split(FormattedFile.LAYER_SEPERATING_STRING).filter((line) => line.length > 0);
	}
	
	static GetDataForLayer(data: string[], layerDepth: number): string[] {
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
		thumbnailContainer.className = 'cfe-thumbnail';
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

		let dataForLayer = '';
		dataForLayer += fileToSave.FileType + '\n';
		dataForLayer += fileToSave.FileName + '\n';
		dataForLayer += fileToSave.ParentFolderID + '\n';
		dataForLayer += FormattedFile.LAYER_SEPERATING_STRING;

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

export class BaseFileCreatorInputForm {
	Source: Source;
	InputFormContainer: HTMLDivElement;
	SelectedFileType: string;
	FileNameInput: HTMLInputElement;
	FileName() {
		return this.FileNameInput.value;
	}
	parentFolderIDInput: HTMLInputElement;
	ParentFolderID() {
		return parseInt(this.parentFolderIDInput.value);
	}

	private constructor() {

	}

	static async Create(inputFormContainer: HTMLDivElement, selectedFileType: string, source: Source): Promise<BaseFileCreatorInputForm> {
		const newForm = new BaseFileCreatorInputForm();
		newForm.Source = source;
		newForm.SelectedFileType = selectedFileType;
		newForm.InputFormContainer = inputFormContainer;
		newForm.InputFormContainer.createEl('h4', { text: 'Section: Base File' } );
		newForm.InputFormContainer.createEl('p', { text: 'File Name' } );
		newForm.FileNameInput = newForm.InputFormContainer.createEl('input', { type: 'text' } );
		newForm.InputFormContainer.createEl('p', { text: 'Parent Folder ID' } );
		newForm.parentFolderIDInput = newForm.InputFormContainer.createEl('input', { type: 'text' } );
		return newForm;
	}

	OnSubmit = async () => {
		return await FormattedFileHandler.CreateNew(this);
	}
}
