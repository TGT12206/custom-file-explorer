import { normalizePath, Notice, Vault } from "obsidian";
import { CFEFileHandler } from "./cfe-file-handler";
import { SourceAndVault } from "./snv";

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
			rootFolder = await CFEFileHandler.CreateNew(snv, 'Folder', 0);
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
		newSourceFolder.vaultPath = vaultPath;
		await SourceFolder.Save(new SourceAndVault(newSourceFolder, vault));
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
