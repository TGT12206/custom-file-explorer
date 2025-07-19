import { CFEFileHandler } from "./cfe-file-handler";
import { FileCreationData } from "./file-creation-data";
import { RealFile } from "./real-file";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";

export class VariantMediaFile extends RealFile {
	fileType = 'Variant Media File';

	private variantIDs: number[];

	async getSrc(snv: SourceAndVault, index: number | null = null): Promise<string> {
		if (index === null) {
			index = Math.floor((Math.random()) * this.variantIDs.length);
		}
		const containedMedia = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, this.variantIDs[index]);
		return await containedMedia.getSrc(snv);
	}

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<VariantMediaFile> {
		const newMediaFile = <VariantMediaFile> (await super.CreateNewFileForLayer(data));
		newMediaFile.variantIDs = [];
		return newMediaFile;
	}

	override async Display(snv: SourceAndVault, container: HTMLDivElement) {
		await super.Display(snv, container);

		const imageDisplayContainer = container.createDiv('vbox');
		imageDisplayContainer.createEl('p', { text: 'Change files' } );
		const mediaIDInputDiv = imageDisplayContainer.createDiv('vbox');
		const newFileButton = imageDisplayContainer.createEl('button', { text: 'Add File' } );
		for (let i = 0; i < this.variantIDs.length; i++) {
			const currentIndex = i;
			const mediaIDDiv = mediaIDInputDiv.createDiv('hbox');
			const idInput = mediaIDDiv.createEl('input', { type: 'text', value: '' + this.variantIDs[currentIndex] } );
			const deleteButton = mediaIDDiv.createEl('button', { text: 'delete' } );
			deleteButton.className = 'cfe-remove-button';
			deleteButton.onclick = async () => {
				mediaIDDiv.remove();
				this.variantIDs.splice(currentIndex, 1);
				await this.Save(snv);
				await this.Display(snv, container);
			}
			idInput.onchange = async () => {
				this.variantIDs[currentIndex] = parseInt(idInput.value);
				await this.Save(snv);
				await this.Display(snv, container);
			}
		}
		newFileButton.onclick = async () => {
			this.variantIDs.push(-1);
			await this.Save(snv);
			await this.Display(snv, container);
		}
		const mediaDiv = imageDisplayContainer.createDiv('vbox');
		
		await this.DisplayMediaOnly(mediaDiv, snv);
	}
	async DisplayMediaOnly(mediaDiv: HTMLDivElement, snv: SourceAndVault, index = -1) {
		// This call is not needed because containedMedia.DisplayMediaOnly() calls it anyway
		// await super.DisplayMediaOnly
		if (index === -1) {
			index = Math.floor((Math.random()) * this.variantIDs.length);
		}
		const containedMedia = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, this.variantIDs[index]);
		await containedMedia.DisplayMediaOnly(mediaDiv, snv);
	}
}
