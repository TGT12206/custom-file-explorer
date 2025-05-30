import { normalizePath, Notice, Vault } from "obsidian";
import { Folder } from "./folder";

/**
 * Contains a list of file names within the source, as well as the path to the source itself.
 */
export class Source {
	container: HTMLDivElement;
	FileCount: number;
	VaultPath: string;

	constructor (vaultPath: string, vault: Vault, container: HTMLDivElement) {
		this.VaultPath = vaultPath;
		this.VaultPath = this.VaultPath.endsWith('/source.md') ? this.VaultPath.slice(0, -10) : this.VaultPath;
		this.container = container;
		const exists = vault.getFileByPath(vaultPath + '/source.md') !== null;
		if (exists) {
			this.LoadExistingSource(vault);
		} else {
			this.CreateNewSource(vault);
		}
	}

	private async CreateNewSource(vault: Vault) {
		this.FileCount = 1;
		await vault.createFolder(this.VaultPath);
		const sourcePath = normalizePath(this.VaultPath + '/source.md');
		await vault.adapter.write(sourcePath, '1');
		const rootFolderPath = normalizePath(this.VaultPath + '/0.md');
		await vault.adapter.write(rootFolderPath, 'Folder\nroot folder');
		await this.Display(vault);
	}

	private async LoadExistingSource(vault: Vault) {
		const sourceTFile = vault.getFileByPath(this.VaultPath + '/source.md');
		if (sourceTFile === null) {
			new Notice("Source File could not be found at the path: " + this.VaultPath + '/source.md');
			return null;
		}
		const data = (await vault.cachedRead(sourceTFile)).split('\n').filter((line) => line.length > 0);
		this.FileCount = parseInt(data[0]);
		await this.Display(vault);
	}

	/**
	 * Loads the source
	 */
	private async Display(vault: Vault) {
		this.container.empty();
		const rootFolder = await Folder.LoadData(this, vault, 0);
		if (rootFolder === null) {
			return;
		}
		await rootFolder.Display(this.container, vault);
	}

	/**
	 * Saves the list of file names
	 * @param vault - the obsidian vault
	 */
	async Save(vault: Vault) {
		// Find the file and check that it isn't null
		const sourceTFile = vault.getFileByPath(this.VaultPath);
		if (sourceTFile === null) {
			new Notice("Source File could not be found at the path: " + this.VaultPath);
			return;
		}
		
		// Empty the file
		await vault.modify(sourceTFile, "");

		// Save the new mapping
		await vault.modify(sourceTFile, '' + this.FileCount);
	}

	async GetFileDataByID(vault: Vault, fileID: number): Promise<string[] | null> {
		// Find the file and check that it isn't null
		const tFile = vault.getFileByPath(this.VaultPath + '/' + fileID + '.md');
		if (tFile === null) {
			new Notice("File could not be found at the path: " + this.VaultPath + '\n' + fileID);
			return null;
		}

		return (await vault.cachedRead(tFile)).split('\n').filter((line) => line.length > 0);
	}
}
