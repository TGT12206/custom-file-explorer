import { normalizePath, TFile } from "obsidian";
import { SourceAndVault } from "./snv";
import { RealFile } from "./real-file";
import { FileCreationData } from "./file-creation-data";

export class SingleMediaFile extends RealFile {
	fileType = 'Single Media File';

	private extensionName: string;
	
	get mediaType(): string {
		switch (this.extensionName) {
			case 'png':
			case 'jpg':
			case 'webp':
			case 'heic':
			case 'gif':
				return 'Image';
			case 'mp4':
			case 'MP4':
			case 'mov':
			case 'MOV':
			default:
				return 'Video';
		}
	}

	override async getSrc(snv: SourceAndVault): Promise<string> {
		const mediaFile = await this.getTFile(snv);
		const arrayBuffer = await snv.vault.readBinary(mediaFile);
		const blob = new Blob([arrayBuffer]);
		const mediaUrl = URL.createObjectURL(blob);
		return mediaUrl;
	}

	private async getTFile(snv: SourceAndVault): Promise<TFile> {
		const mediaPath = await this.getPath(snv);
		let mediaFile = snv.vault.getFileByPath(mediaPath);
		if (mediaFile === null) {
			mediaFile = snv.vault.getFileByPath(mediaPath + '.' + this.extensionName);
			if (mediaFile === null) {
				throw Error('File not found at path: ' + mediaPath + ' or ' + mediaPath + '.' + this.extensionName);
			}
			snv.vault.rename(mediaFile, mediaPath);
		}
		return mediaFile;
	}

	private async getPath(snv: SourceAndVault): Promise<string> {
		const sourceFolder = snv.sourceFolder;
		return sourceFolder.vaultPath + '/' + this.id + ' Actual File';
	}

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<SingleMediaFile> {
		const newMediaFile = <SingleMediaFile> (await super.CreateNewFileForLayer(data));
		newMediaFile.extensionName = '';
		return newMediaFile;
	}

	override async Display(snv: SourceAndVault, container: HTMLDivElement) {
		await super.Display(snv, container);

		const imageDisplayContainer = container.createDiv('vbox');
		imageDisplayContainer.createEl('p', { text: 'Change file' } );
		const newFileInput = imageDisplayContainer.createEl('input', { type: 'file' } );

		await this.DisplayMediaOnly(imageDisplayContainer, snv);
		
		newFileInput.onchange = async () => {
			try {
				const oldFile = await this.getTFile(snv);
				try {
					await snv.vault.delete(oldFile);
				} finally {
					await this.SaveNewFile(snv, newFileInput);
					this.Display(snv, container);
				}
			} catch {
				console.log();
			}
		}
	}

	private async SaveNewFile(snv: SourceAndVault, fileInput: HTMLInputElement) {
		const fileArray = fileInput.files;
		if (fileArray === null) {
			throw Error("no file was selected");
		}
		const mediaFile = fileArray[0];
		await this.SetFileTo(snv, mediaFile);
	}

	async SetFileTo(snv: SourceAndVault, mediaFile: File) {
		const partsOfPath = mediaFile.name.split('.');
		const extension = partsOfPath[partsOfPath.length - 1];
		this.fileName = partsOfPath[0];
		this.extensionName = extension;
		const path = snv.sourceFolder.vaultPath + '/' + this.id + ' Actual File';
		const normalizedPath = normalizePath(path);
		await snv.vault.adapter.writeBinary(normalizedPath, await mediaFile.arrayBuffer());
		await this.Save(snv);
	}

	async DisplayMediaOnly(mediaDiv: HTMLDivElement, snv: SourceAndVault) {
		await super.DisplayMediaOnly(mediaDiv, snv);
		if (this.mediaType === 'Image') {
			const imageElement = mediaDiv.createEl('img');
			imageElement.src = await this.getSrc(snv);
			imageElement.style.objectFit = 'contain';
		} else {
			const videoElement = mediaDiv.createEl('video');
			videoElement.src = await this.getSrc(snv);
			videoElement.controls = true;
			videoElement.loop = true;
			videoElement.autoplay = true;
			videoElement.style.objectFit = 'contain';
		}
	}
}
