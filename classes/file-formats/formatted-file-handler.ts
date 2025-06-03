import { Source } from "classes/source";
import { BaseFileCreatorInputForm, FormattedFile } from "./formatted-file";
import { Folder } from "./folder";
import { Notice } from "obsidian";

export class FormattedFileHandler {
	static async CreateNew(inputFields: BaseFileCreatorInputForm): Promise<FormattedFile> {
		const newFile = new FormattedFile();
		switch(inputFields.SelectedFileType) {
			case 'Folder':
				return await Folder.CreateNewFileForLayer(inputFields, <Folder> newFile);
			default:
				return await FormattedFile.CreateNewFileForLayer(inputFields, newFile);
		}
	}
	static async LoadFile(source: Source, fileID: number): Promise<FormattedFile> {
		const data = await FormattedFile.GetFileDataByID(source, fileID);
		const fileType = FormattedFile.GetDataForLayer(data, FormattedFile.CLASS_DEPTH)[0];
		switch(fileType) {
			case 'Folder':
				return await Folder.LoadLayer(source, fileID, data);
			default:
				return await FormattedFile.LoadLayer(source, fileID, data);
		}
	}
	static async Display(fileToDisplay: FormattedFile, container: HTMLDivElement) {
		switch(fileToDisplay.FileType) {
			case 'Folder': {
				return await Folder.DisplayForLayer(<Folder> fileToDisplay, container);
			}
			default:
				return null;
		}
	}
	static async DisplayThumbnail(fileToDisplay: FormattedFile, thumbnailContainer: HTMLDivElement, displayContainer: HTMLDivElement) {
		switch(fileToDisplay.FileType) {
			case 'Folder': {
				return await Folder.DisplayThumbnailForLayer(<Folder> fileToDisplay, thumbnailContainer, displayContainer);
			}
			default:
				return null;
		}
	}
	static async DisplayCreationForm(inputFormContainer: HTMLDivElement, selectedFileType: string, source: Source) {
		switch(selectedFileType) {
			case 'Folder': {
				// Folder does not have any fields to fill out
				return BaseFileCreatorInputForm.Create(inputFormContainer, selectedFileType, source);
			}
			default:
				return BaseFileCreatorInputForm.Create(inputFormContainer, selectedFileType, source);
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
			case 'Folder': {
				return await Folder.SaveFileForLayer(tFile, <Folder> fileToSave);
			}
			default:
				return await FormattedFile.SaveFileForLayer(tFile, fileToSave);
		}
	}
	static async MoveFile(fileToMove: FormattedFile, newParentFolderID: number) {
		await FormattedFile.MoveFile(fileToMove, newParentFolderID);
	}
}
