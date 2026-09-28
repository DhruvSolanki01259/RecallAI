const MAX_FILES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const validateFiles = (files: File[]) => {
  if (files.length === 0) {
    return "Please select at least one PDF file.";
  }

  if (files.length > MAX_FILES) {
    return "You can upload at most 5 PDF files at a time.";
  }

  for (const file of files) {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return `"${file.name}" is not a PDF. Only PDF files are allowed.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds the 20 MB file size limit.`;
    }
  }

  return null;
};
