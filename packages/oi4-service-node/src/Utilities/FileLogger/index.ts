import { fstatSync, existsSync, appendFileSync, openSync, closeSync, unlinkSync, mkdirSync, readdirSync } from 'fs';

const rootdir = '/usr/local/share/oi4registry/logs';

export class FileLogger {
  private currentlyUsedFiles: string[];
  private currentlyUsedIndex: number;
  private currentFd: number;
  private fileCount: number;
  private enabled: boolean;
  private logFileSize: number;

  constructor(logsize: number, enabled: boolean) {
    this.fileCount = 4;
    this.currentlyUsedFiles = [];
    this.currentlyUsedIndex = 0;
    this.currentlyUsedFiles[this.currentlyUsedIndex] = `RegistryLog_${this.currentlyUsedIndex}_${this.getCurrentTimestamp()}.reglog`;
    this.currentFd = 0;
    this.enabled = true;
    this.logFileSize = logsize;
    if (!existsSync(rootdir)) {
      mkdirSync(rootdir, { recursive: true });
    }
  }

  private getFilesFromPath(path: string, extension: string) {
    const dir = readdirSync(path);
    return dir.filter(elm => elm.match(new RegExp(`.*\.(${extension})$`, 'ig')));
  }

  private getCurrentTimestamp() {
    let rightNow = new Date().toISOString();
    rightNow = rightNow.replace(/-/g, '');
    rightNow = rightNow.replace(/:/g, '');
    rightNow = rightNow.replace(/\./g, 'MS');
    return rightNow;
  }

  deleteFiles() { // As a safety measure, delete all files when we are changing fileSize
    const reglogArr = this.getFilesFromPath(rootdir, 'reglog');
    for (const reglogs of reglogArr) {
      try {
        console.log(`Deleting ${reglogs}`);
        unlinkSync(`${rootdir}/${reglogs}`); // Delete old file
      } catch (e) {
        if (e.code === 'ENOENT') {
          // That's ok, no need to delete a non-existing file
        } else {
          console.log(e);
        }
      }
    }
    return reglogArr;
  }

  flushToLogfile(flushArr: any[]) { // TODO: Change fileOperations to Async
    console.log('_____-------______------FLUSH CALLED------______-----_____');
    console.log(`${rootdir}/${this.currentlyUsedFiles[this.currentlyUsedIndex]}`);
    this.currentFd = openSync(`${rootdir}/${this.currentlyUsedFiles[this.currentlyUsedIndex]}`, 'a');
    let fsObj = fstatSync(this.currentFd);
    if (fsObj.size === 0) {
      appendFileSync(this.currentFd, '['); // Start of the file, open Array
      fsObj = fstatSync(this.currentFd);
    }
    if (fsObj.size >= (this.logFileSize / this.fileCount)) { // Size is bigger than an individual file may be
      this.flushEntries(flushArr, fsObj.size); // TODO: Double function call
      if (this.currentlyUsedIndex < this.fileCount - 1) { // Increment current file counter
        this.currentlyUsedIndex = this.currentlyUsedIndex + 1;
      } else {
        this.currentlyUsedIndex = 0; // Round trip
      }
      if (typeof this.currentlyUsedFiles[this.currentlyUsedIndex] !== 'undefined') { // Old file exists
        try {
          unlinkSync(`${rootdir}/${this.currentlyUsedFiles[this.currentlyUsedIndex]}`); // Delete old file
        } catch (e) {
          console.log('something went wrong with file deletion');
          if (e.code === 'ENOENT') {
            // That's ok, no need to delete a non-existing file
            console.log('Trying to delete an already deleted files in flushToFile');
          } else {
            console.log(e);
          }
        }
      }
      this.currentlyUsedFiles[this.currentlyUsedIndex] = `RegistryLog_${this.currentlyUsedIndex}_${this.getCurrentTimestamp()}.reglog`; // Set new filename, will be created with next openSync
      appendFileSync(this.currentFd, ']'); // Close Array
    } else {
      this.flushEntries(flushArr, fsObj.size);
    }
    closeSync(this.currentFd);
  }

  private flushEntries(entryArr: any[], initialSize: number) {
    let size = initialSize;
    for (const entries of entryArr) {
      if (size !== 1) { // Since there is not only a '[' in the file, we can append the array
        appendFileSync(this.currentFd, ','); // Separator between Objects
        appendFileSync(this.currentFd, JSON.stringify(entries, null, 2));
      } else {
        appendFileSync(this.currentFd, JSON.stringify(entries, null, 2));
        size = fstatSync(this.currentFd).size;
      }
    }
  }
}
