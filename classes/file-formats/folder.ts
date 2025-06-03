import { normalizePath, TFile } from "obsidian";
import { BaseFileCreatorInputForm, FormattedFile } from "./formatted-file";
import { Source } from "../source";
import { FileCreatorUI } from "classes/file-creator-ui";
import { FormattedFileHandler } from "./formatted-file-handler";

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
	static override async CreateNewFileForLayer(inputFields: BaseFileCreatorInputForm, unfinishedFile: Folder): Promise<Folder> {
		await super.CreateNewFileForLayer(inputFields, unfinishedFile);
		unfinishedFile.ContainedFileIDs = [];
		return unfinishedFile;
	}

	static async LoadOrCreateRootFolder(source: Source): Promise<Folder> {
		const newFolder = new Folder();
		newFolder.FileType = 'Folder';
		newFolder.Source = source;
		newFolder.ID = 0;
		newFolder.FileName = 'root folder';
		newFolder.ParentFolderID = 0;
		newFolder.ContainedFileIDs = [];
		if (source.FileCount === 0) {
			source.FileCount = 1;
			await source.Save();
			const filePath = normalizePath(source.VaultPath + '/' + newFolder.ID + '.md');
			await source.vault.adapter.write(filePath, 'Folder\nroot folder\n0' + FormattedFile.LAYER_SEPERATING_STRING);
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
		const folderDisplayContainer = container.createDiv('cfe-display-folder');
		const headerContainer = folderDisplayContainer.createDiv('cfe-display-folder-header');
		const backButton = headerContainer.createEl('button', { text: 'Back to parent folder' } );
		backButton.className = 'cfe-back-to-parent-button';
		backButton.onclick = async () => {
			const parentFolder = await FormattedFileHandler.LoadFile(source, folderToDisplay.ParentFolderID);
			if (parentFolder !== null) {
				await FormattedFileHandler.Display(parentFolder, container);
			}
		}
		const createFileButton = headerContainer.createEl('button', { text: 'Create new File' } );
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
		let dataForLayer = '';
		for (let i = 0; i < folderToSave.ContainedFileIDs.length; i++) {
			dataForLayer += folderToSave.ContainedFileIDs[i] + '\n';
		}
		dataForLayer += FormattedFile.LAYER_SEPERATING_STRING;

		folderToSave.Source.vault.append(tFile, dataForLayer);
	}
}
