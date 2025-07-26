import { CFEFile } from "./cfe-file";
import { SourceAndVault } from "./snv";

export abstract class RealFile extends CFEFile {
	abstract getSrc(sourceAndVault: SourceAndVault): Promise<string>;
	async DisplayMediaOnly(mediaDiv: HTMLDivElement, snv: SourceAndVault) {
		mediaDiv.empty();
	}
}
