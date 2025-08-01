import { CFEFile } from "./cfe-file";
import { Folder } from "./folder";
import { Playlist } from "./playlist";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";
import { VariantMediaFile } from "./variant-media-file";
import { SourceFolderShortcut } from "./source-folder-shortcut";
import { ConlangDictionary } from "./conlang-dictionary";
import { Story } from "./story";
import { StorageOrganizer } from "./storage-organizer";

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
		'Conlang Dictionary',
		'Storage Organizer'
	]

	static async CreateNew(snv: SourceAndVault, fileType: string, parentFolderID: number, name: string): Promise<CFEFile> {
		let newFile: CFEFile;
		switch(fileType) {
			case 'Folder':
			default:
				newFile = await Folder.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
				break;
			case 'Single Media File':
				newFile = await SingleMediaFile.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
				break;
			case 'Variant Media File':
				newFile = await VariantMediaFile.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
				break;
			case 'Playlist':
				newFile = await Playlist.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
				break;
			case 'Story':
				newFile = await Story.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
				break;
			case 'Source Folder Shortcut':
				newFile = await SourceFolderShortcut.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
				break;
			case 'Conlang Dictionary':
				newFile = await ConlangDictionary.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
				break;
			case 'Storage Organizer':
				newFile = await StorageOrganizer.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
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
			throw Error("File could not be found at the path: " + sourceFolder.vaultPath + '/' + fileID + '.json');
		}
		const jsonData = await vault.cachedRead(tFile);
		const plainObject = JSON.parse(jsonData);
		switch(plainObject.fileType) {
			case 'Folder':
			default:
				return Object.assign(new Folder(), plainObject).LoadAllInnerObjects();
			case 'Single Media File':
				return Object.assign(new SingleMediaFile(), plainObject).LoadAllInnerObjects();
			case 'Variant Media File':
				return Object.assign(new VariantMediaFile(), plainObject).LoadAllInnerObjects();
			case 'Playlist':
				return Object.assign(new Playlist(), plainObject).LoadAllInnerObjects();
			case 'Story':
				return Object.assign(new Story(), plainObject).LoadAllInnerObjects();
			case 'Source Folder Shortcut':
				return Object.assign(new SourceFolderShortcut(), plainObject).LoadAllInnerObjects();
			case 'Conlang Dictionary':
				return Object.assign(new ConlangDictionary(), plainObject).LoadAllInnerObjects();
			case 'Storage Organizer':
				return Object.assign(new StorageOrganizer(), plainObject).LoadAllInnerObjects();
		}
	}
}
