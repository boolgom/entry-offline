import fstream from 'fstream';
import archiver from 'archiver';
import zlib from 'zlib';
import path from 'path';
import { ProgressTypes } from './Constants';

class MainUtils {
    constructor(window) {
        this.window = window;
    }

    async saveProject({ sourcePath, destinationPath }) {
        return new Promise((resolve, reject) => {
            var archive = archiver('tar');
            var gzip = zlib.createGzip();
            var fs_writer = fstream.Writer({
                path: destinationPath,
                mode: '0777',
                type: 'File',
            });

            fs_writer.on('error', (e) => {
                reject(e);
            });

            fs_writer.on('end', () => {
                this.window.setProgressBar(ProgressTypes.DISABLE_PROGRESS);
                resolve();
            });
            archive.on('error', (e) => {
                reject(e);
            });
            archive.on('entry', () => {
                // console.log(a.name);
                // console.log(a, b, c);
            });
            archive.on('progress', ({ fs }) => {
                const { totalBytes, processedBytes } = fs;
                this.window.setProgressBar(processedBytes / totalBytes);
            });

            archive.pipe(gzip).pipe(fs_writer);

            archive.file(path.join(sourcePath, 'temp', 'project.json'), {
                name: 'temp/project.json',
            });
            archive.glob(
                '**',
                {
                    cwd: path.resolve(sourcePath, 'temp'),
                    ignore: ['project.json'],
                },
                {
                    prefix: 'temp',
                }
            );
            archive.finalize();
        });
    }

    lpad = (str, len) => {
        var strLen = str.length;
        if (strLen < len) {
            for (var i=0; i<len-strLen; i++) {
                str = "0" + str;
            }
        }
        return String(str);
    };

    getPaddedVersion = (version) => {
        if(!version) {
            return '';
        }
        version = String(version);

        var padded = [];
        var splitVersion = version.split('.');
        splitVersion.forEach((item) => {
            padded.push(this.lpad(item, 4));
        });

        return padded.join('.');
    }
}

export default MainUtils;
