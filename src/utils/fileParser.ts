import JSZip from 'jszip';
import { FileAttachment, ZipEntryItem } from '../types';

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'xml', 'yaml', 'yml', 'toml', 'ini', 'env',
  'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts',
  'py', 'pyw', 'java', 'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hh', 'hxx', 'cs', 'go', 'rs',
  'php', 'rb', 'swift', 'kt', 'kts', 'dart', 'scala', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'html', 'htm', 'xhtml', 'css', 'scss', 'sass', 'less',
  'sql', 'graphql', 'gql', 'proto', 'dockerfile', 'makefile', 'log', 'conf', 'config'
]);

export function isTextFileName(filename: string): boolean {
  const parts = filename.toLowerCase().split('.');
  if (parts.length > 1) {
    const ext = parts.pop()!;
    if (TEXT_EXTENSIONS.has(ext)) return true;
  }
  const baseName = filename.toLowerCase();
  return baseName === 'dockerfile' || baseName === 'makefile' || baseName.startsWith('.env');
}

/**
 * Universal file processor: handles ZIP archives, multimodal images, code, docs, and any binary.
 */
export async function processUploadedFile(file: File): Promise<FileAttachment> {
  const filename = file.name;
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const isZip = extension === 'zip' || file.type.includes('zip');
  const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(extension);

  // 1. Handle ZIP Archive Unpacking
  if (isZip) {
    try {
      const zip = await JSZip.loadAsync(file);
      const zipEntries: ZipEntryItem[] = [];
      const filePaths: string[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        // Skip hidden OS files (e.g. __MACOSX, .DS_Store)
        if (relativePath.includes('__MACOSX') || relativePath.includes('.DS_Store')) continue;

        filePaths.push(relativePath);
        const isText = isTextFileName(relativePath);
        let content: string | undefined = undefined;

        if (isText) {
          try {
            content = await zipEntry.async('text');
            // Truncate individual huge text files inside zip to 30KB to avoid memory blowup
            if (content.length > 30000) {
              content = content.slice(0, 30000) + '\n... [Remaining lines truncated for context efficiency]';
            }
          } catch (e) {
            content = undefined;
          }
        }

        // @ts-ignore: _data size or standard size
        const entrySize = (zipEntry as any)._data?.uncompressedSize || 0;
        zipEntries.push({
          name: relativePath,
          size: entrySize,
          content,
          isText,
        });
      }

      // Generate structured summary of ZIP contents
      const textFilesCount = zipEntries.filter((e) => e.isText && e.content).length;
      const treeSummary = filePaths.slice(0, 30).map((p) => `  - ${p}`).join('\n');
      const moreCount = filePaths.length > 30 ? `\n  ... and ${filePaths.length - 30} more files` : '';

      const textContent = `[Extracted ZIP Archive: ${filename} (${(file.size / 1024).toFixed(1)} KB)]\n` +
        `Total Files: ${zipEntries.length} (${textFilesCount} readable code/text files)\n\n` +
        `Directory Structure:\n${treeSummary}${moreCount}\n\n` +
        `--- Extracted Source Files ---\n` +
        zipEntries
          .filter((e) => e.isText && e.content)
          .slice(0, 15) // Top 15 key files
          .map((e) => `#### File: \`${e.name}\`\n\`\`\`${e.name.split('.').pop() || 'text'}\n${e.content}\n\`\`\``)
          .join('\n\n');

      return {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: filename,
        size: file.size,
        type: 'application/zip',
        isImage: false,
        isZip: true,
        zipEntries,
        category: 'zip',
        textContent,
      };
    } catch (err: any) {
      console.warn('ZIP unpacking error, falling back to binary:', err);
      return {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: filename,
        size: file.size,
        type: 'application/zip',
        isImage: false,
        isZip: true,
        category: 'zip',
        textContent: `[ZIP Archive: ${filename} (${(file.size / 1024).toFixed(1)} KB) - Could not decompress client-side: ${err.message}]`,
      };
    }
  }

  // 2. Handle Multimodal Images
  if (isImage) {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });

    return {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: filename,
      size: file.size,
      type: file.type || 'image/png',
      dataUrl,
      isImage: true,
      category: 'image',
    };
  }

  // 3. Handle Code, Data, Documents, and Text
  const isText = isTextFileName(filename) || file.type.startsWith('text/') || extension === 'pdf';
  if (isText) {
    const textContent = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });

    const isCode = ['js', 'jsx', 'ts', 'tsx', 'py', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'java', 'html', 'css', 'sql', 'sh', 'json', 'yaml'].includes(extension);
    const isData = ['csv', 'tsv', 'json', 'xml'].includes(extension);

    return {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: filename,
      size: file.size,
      type: file.type || 'text/plain',
      textContent,
      isImage: false,
      category: isCode ? 'code' : isData ? 'data' : 'document',
    };
  }

  // 4. Any other file type (Binary, Audio, Video, Archives, etc.)
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: filename,
    size: file.size,
    type: file.type || 'application/octet-stream',
    isImage: false,
    category: 'binary',
    textContent: `[File Attachment: ${filename} | Size: ${(file.size / 1024).toFixed(1)} KB | MIME: ${file.type || 'binary/unknown'}]`,
  };
}
