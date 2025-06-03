import { normalizePath, Notice, Vault } from "obsidian";
import { Folder } from "./file-formats/folder";
import { FormattedFileHandler } from "./file-formats/formatted-file-handler";
import { FormattedFile } from "./file-formats/formatted-file";

/**
 * A representation of the source (similar to a vault). Contains a reference to the vault path and file count.
 */
export class Source {
	container: HTMLDivElement;
	FileCount: number;
	VaultPath: string;
	vault: Vault;

	constructor (vaultPath: string, vault: Vault, container: HTMLDivElement) {
		this.VaultPath = vaultPath;
		this.VaultPath = this.VaultPath.endsWith('/source.md') ? this.VaultPath.slice(0, -10) : this.VaultPath;
		this.vault = vault;
		this.container = container;
		const exists = vault.getFileByPath(vaultPath + '/source.md') !== null;
		if (exists) {
			this.LoadExistingSource();
		} else {
			this.CreateNewSource();
		}
	}

	private async CreateNewSource() {
		this.FileCount = 1;
		try {
			await this.vault.createFolder(this.VaultPath);
		} finally {
			const sourcePath = normalizePath(this.VaultPath + '/source.md');
			await this.vault.adapter.write(sourcePath, '1');
			const rootFolderPath = normalizePath(this.VaultPath + '/0.md');
			await this.vault.adapter.write(rootFolderPath, 'Folder\nroot folder\n0');
			this.container.empty();
			const rootFolder = await Folder.LoadOrCreateRootFolder(this);
			await FormattedFileHandler.Display(rootFolder, this.container);
		}
	}

	private async LoadExistingSource() {
		const sourceTFile = this.vault.getFileByPath(this.VaultPath + '/source.md');
		if (sourceTFile === null) {
			new Notice("Source File could not be found at the path: " + this.VaultPath + '/source.md');
			return null;
		}
		const fileCountData = (await this.vault.cachedRead(sourceTFile)).split('\n').filter((line) => line.length > 0);
		this.FileCount = parseInt(fileCountData[0]);
		this.container.empty();
		const rootFolderData = await FormattedFile.GetFileDataByID(this, 0);
		if (rootFolderData === null) {
			return;
		}
		const rootFolder = await Folder.LoadOrCreateRootFolder(this);
		await FormattedFileHandler.Display(rootFolder, this.container);
	}

	/**
	 * Saves the new file count
	 */
	async Save() {
		// Find the file and check that it isn't null
		const sourceTFile = this.vault.getFileByPath(this.VaultPath + '/source.md');
		if (sourceTFile === null) {
			new Notice("Source File could not be found at the path: " + this.VaultPath + '/source.md');
			throw Error("Source File could not be found at the path: " + this.VaultPath + '/source.md');
		}

		// Save the new file count
		await this.vault.modify(sourceTFile, '' + this.FileCount);
	}
}
