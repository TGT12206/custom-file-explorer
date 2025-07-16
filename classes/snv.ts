import { Vault } from "obsidian";
import { SourceFolder } from "./source-folder";

export class SourceAndVault {
	sourceFolder: SourceFolder;
	vault: Vault;
	constructor(sourceFolder: SourceFolder, vault: Vault) {
		this.sourceFolder = sourceFolder;
		this.vault = vault;
	}
}
