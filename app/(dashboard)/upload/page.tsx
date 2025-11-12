// T023: Upload page with file input restricted to PDF files
'use client';

import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import type { ExtractedProtocolData } from '@/types/database.types';
import { ExtractionResults } from '@/components/ExtractionResults';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProtocolData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are accepted');
        setFile(null);
        return;
      }

      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError(`Protocol PDF must be 50MB or smaller (current size: ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB)`);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('protocol', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Extraction failed');
      }

      const data = await response.json();
      setExtractedData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while extracting protocol data');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Protocol</h1>

        {!extractedData && (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="mb-6">
              <label
                htmlFor="protocol-upload"
                className="block text-base font-medium text-gray-900 mb-2"
              >
                Select Protocol PDF
              </label>
              <input
                id="protocol-upload"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="block w-full text-base text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 p-3"
                disabled={isExtracting}
              />
              <p className="mt-2 text-base text-gray-600">
                Maximum file size: 50MB
              </p>
            </div>

            {file && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-base text-gray-900">
                  <span className="font-medium">Selected file:</span> {file.name}
                </p>
                <p className="text-base text-gray-600">
                  Size: {(file.size / (1024 * 1024)).toFixed(2)}MB
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-base text-red-600">{error}</p>
              </div>
            )}

            <Button
              onClick={handleExtract}
              disabled={!file || isExtracting}
              className="w-full"
            >
              {isExtracting ? 'Extracting protocol data...' : 'Extract'}
            </Button>

            {isExtracting && (
              <p className="mt-4 text-center text-base text-gray-600">
                This may take up to 5 minutes for complex protocols...
              </p>
            )}
          </div>
        )}

        {extractedData && (
          <ExtractionResults data={extractedData} />
        )}
      </div>
    </div>
  );
}
