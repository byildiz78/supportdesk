import fs from 'fs';
import path from 'path';
import { File } from 'formidable';

export async function saveFile(file: File, fileName: string): Promise<string> {
    const uploadDir = path.join(process.env.FILE_UPLOAD_DIR || process.cwd());

    // Create directories if they don't exist
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Read the temporary file
    const data = fs.readFileSync(file.filepath);

    // Write to the target location
    fs.writeFileSync(filePath, data);

    // Delete the temporary file
    fs.unlinkSync(file.filepath);

    // Return relative path from public directory
    return `${process.env.FILE_UPLOAD_DIR || ''}/${fileName}`;
}
