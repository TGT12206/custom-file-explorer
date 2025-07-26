import { CFEFile } from "./cfe-file";
import { SourceAndVault } from "./snv";
import { SourceFolder } from "./source-folder";

/**
 * A child class of the CFEFile class. Represents a folder within the SourceFolder.
 */
export class SourceFolderShortcut extends CFEFile {
	/**
	 * The IDs of files contained in this folder
	 */
	pathToOtherSource: string;

	/**
	 * @override Folder layer:
	 * 
	 * initializes the contained file ids array for the folder object
	 */
	static override async CreateNewFileForLayer(snv: SourceAndVault, fileType: string, parentFolderID: number, name: string): Promise<SourceFolderShortcut> {
		const unfinishedFolder = <SourceFolderShortcut> (await super.CreateNewFileForLayer(snv, fileType, parentFolderID, name));
		unfinishedFolder.pathToOtherSource = '';
		return unfinishedFolder;
	}

	override async Display(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		await super.Display(snv, mainDiv);
		const inputDiv = mainDiv.createDiv('vbox');
		inputDiv.createEl('p', { text: 'Path to Other Source Folder' } );
		const pathInput = inputDiv.createEl('input', { type: 'text' } );
		const goButton = inputDiv.createEl('button', { text: 'Go' } );
		pathInput.onchange = async () => {
			this.pathToOtherSource = pathInput.value;
			await this.Save(snv);
		}
		goButton.onclick = async () => {
			const otherSource = await SourceFolder.CreateOrLoadSourceFolder(this.pathToOtherSource, snv.vault);
			otherSource.Display(mainDiv, snv.vault);
		}
	}
	}
