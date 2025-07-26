import { Notice } from "obsidian";
import { CFEFile } from "./cfe-file";
import { Folder } from "./folder";
import { Playlist } from "./playlist";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";
import { VariantMediaFile } from "./variant-media-file";
import { SourceFolderShortcut } from "./source-folder-shortcut";
import { ConlangDictionary } from "./conlang-dictionary";
import { Story } from "./story";

export class CFEFileHandler {

	/**
	 * All of the known file formats
	 */
	static KnownFileTypes: string[] = [
		'Folder',
		'Single Media File',
		'Variant Media File',
		'Playlist',
		'Story',
		'Source Folder Shortcut',
		'Conlang Dictionary'
	]

	static async CreateNew(snv: SourceAndVault, fileType: string, parentFolderID: number): Promise<CFEFile> {
		let newFile: CFEFile;
		switch(fileType) {
			case 'Folder':
			default:
				newFile = await Folder.CreateNewFileForLayer(snv, fileType, parentFolderID);
				break;
			case 'Single Media File':
				newFile = await SingleMediaFile.CreateNewFileForLayer(snv, fileType, parentFolderID);
				break;
			case 'Variant Media File':
				newFile = await VariantMediaFile.CreateNewFileForLayer(snv, fileType, parentFolderID);
				break;
			case 'Playlist':
				newFile = await Playlist.CreateNewFileForLayer(snv, fileType, parentFolderID);
				break;
			case 'Story':
				newFile = await Story.CreateNewFileForLayer(snv, fileType, parentFolderID);
				break;
			case 'Source Folder Shortcut':
				newFile = await SourceFolderShortcut.CreateNewFileForLayer(snv, fileType, parentFolderID);
				break;
			case 'Conlang Dictionary':
				newFile = await ConlangDictionary.CreateNewFileForLayer(snv, fileType, parentFolderID);
				break;
		}
		await newFile.Save(snv);
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
				return await Object.assign(new Folder(), plainObject);
			case 'Single Media File':
				return await Object.assign(new SingleMediaFile(), plainObject);
			case 'Variant Media File':
				return await Object.assign(new VariantMediaFile(), plainObject);
			case 'Playlist':
				return await Object.assign(new Playlist(), plainObject);
			case 'Story':
				return await Object.assign(new Story(), plainObject);
			case 'Source Folder Shortcut':
				return await Object.assign(new SourceFolderShortcut(), plainObject);
			case 'Conlang Dictionary':
				return await Object.assign(new ConlangDictionary(), plainObject);
		}
	}
}
