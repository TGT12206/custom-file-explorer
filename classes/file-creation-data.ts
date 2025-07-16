import { SourceAndVault } from "./snv";

export class FileCreationData {
	snv: SourceAndVault;
	fileType: string;
	parentFolderID: number;
	constructor(snv: SourceAndVault, fileType: string, parentFolderID: number) {
		this.snv = snv;
		this.fileType = fileType;
		this.parentFolderID = parentFolderID;
	}
}
