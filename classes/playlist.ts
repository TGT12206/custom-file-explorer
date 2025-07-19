import { CFEFile } from "./cfe-file";
import { CFEFileHandler } from "./cfe-file-handler";
import { FileCreationData } from "./file-creation-data";
import { RealFile } from "./real-file";
import { SourceAndVault } from "./snv";

export class Playlist extends CFEFile {
	private currentVideoIndex: number;
	videoIDs: number[];

	private videoOrder: string;

	private static getNextVideoIDInOrder(playlist: Playlist) {
		let nextVideoIndex = playlist.currentVideoIndex + 1;
		if (nextVideoIndex >= playlist.videoIDs.length) {
			nextVideoIndex = 0;
		}
		return nextVideoIndex;
	}
	private static getNextVideoIDShuffled(playlist: Playlist) {
		let nextVideoIndex = Math.random() * playlist.videoIDs.length;
		nextVideoIndex = Math.floor(nextVideoIndex);
		return nextVideoIndex;
	}

	private static async loadNextVideo(sourceAndVault: SourceAndVault, playlist: Playlist, videoElement: HTMLVideoElement) {
		if (playlist.videoOrder === 'shuffled') {
			playlist.currentVideoIndex = Playlist.getNextVideoIDShuffled(playlist);
		} else {
			playlist.currentVideoIndex = Playlist.getNextVideoIDInOrder(playlist);
		}
		const nextVideo = <RealFile> (await CFEFileHandler.LoadFile(sourceAndVault, playlist.videoIDs[playlist.currentVideoIndex]));

		videoElement.src = await nextVideo.getSrc(sourceAndVault);
	}

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<Playlist> {
		const newPlaylistFile = <Playlist> (await super.CreateNewFileForLayer(data));
		newPlaylistFile.videoIDs = [];
		return newPlaylistFile;
	}

	override async Display(snv: SourceAndVault, container: HTMLDivElement) {
		await super.Display(snv, container);
		this.currentVideoIndex = 0;
		const videoDisplayContainer = container.createDiv('cfe-display-video');
		const videoElement = videoDisplayContainer.createEl('video');
		const buttonsContainer = container.createDiv('hbox');
		const hideButton = buttonsContainer.createEl('button', { text: 'hide video' } );
		hideButton.onclick = () => {
			if (hideButton.textContent === 'hide video') {
				hideButton.textContent = 'show video';
				videoElement.style.display = 'none';
			} else {
				hideButton.textContent = 'hide video';
				videoElement.style.display = 'flex';
			}
		}
		const shuffleButton = buttonsContainer.createEl('button', { text: 'shuffle' } );
		this.videoOrder = 'in order';
		shuffleButton.onclick = () => {
			if (shuffleButton.textContent === 'shuffle') {
				shuffleButton.textContent = 'go in order';
				this.videoOrder = 'shuffled';
			} else {
				shuffleButton.textContent = 'shuffle';
				this.videoOrder = 'in order';
			}
		}
		const nextButton = buttonsContainer.createEl('button', { text: 'next video' } );
		nextButton.onclick = async () => {
			await Playlist.loadNextVideo(snv, this, videoElement);
		}

		try {
			const firstVideo = <RealFile> (await CFEFileHandler.LoadFile(snv, this.videoIDs[this.currentVideoIndex]));
			videoElement.src = await firstVideo.getSrc(snv);
			videoElement.autoplay = true;
			videoElement.controls = true;
			videoElement.ontimeupdate = async () => {
				if (videoElement.ended) {
					await Playlist.loadNextVideo(snv, this, videoElement);
				}
			}
		} finally {
			container.createEl('p', { text: 'Change files' } );
			let count = 0;
			const mediaIDInputDiv = container.createDiv('vbox');
			const newFileButton = container.createEl('button', { text: 'Add File' } );
			for (let i = 0; i < this.videoIDs.length; i++) {
				const currentIndex = count;
				count++;
				const mediaIDDiv = mediaIDInputDiv.createDiv('hbox');
				const idInput = mediaIDDiv.createEl('input', { type: 'text', value: '' + this.videoIDs[currentIndex] } );
				const deleteButton = mediaIDDiv.createEl('button', { text: 'delete' } );
				deleteButton.onclick = () => {
					mediaIDDiv.remove();
					this.videoIDs.splice(currentIndex, 1);
					this.Display(snv, container);
				}
				idInput.onchange = () => {
					this.videoIDs[currentIndex] = parseInt(idInput.value);
					this.Save(snv);
				}
			}
			newFileButton.onclick = () => {
				const currentIndex = count;
				count++;
				const mediaIDDiv = mediaIDInputDiv.createDiv('hbox');
				const idInput = mediaIDDiv.createEl('input', { type: 'text' } );
				const deleteButton = mediaIDDiv.createEl('button', { text: 'delete' } );
				deleteButton.onclick = () => {
					mediaIDDiv.remove();
					this.videoIDs.splice(currentIndex, 1);
					this.Display(snv, container);
				}
				idInput.onchange = () => {
					this.videoIDs[currentIndex] = parseInt(idInput.value);
					this.Save(snv);
				}
			}
		}
	}
}
