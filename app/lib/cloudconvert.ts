import axios from 'axios';

export interface CloudConvertTask {
  name: string;
  operation: string;
  [key: string]: any;
}

export async function runCloudConvertJob(
  fileBase64: string,
  fileName: string,
  inputFormat: string,
  outputFormat: string,
  options: Record<string, any> = {}
): Promise<string> {
  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  if (!apiKey) throw new Error('CloudConvert API key is missing');

  const tasks: Record<string, CloudConvertTask> = {
    'import-file': {
      name: 'import-file',
      operation: 'import/base64',
      file: fileBase64,
      filename: fileName,
    },
    'convert-file': {
      name: 'convert-file',
      operation: 'convert',
      input: 'import-file',
      input_format: inputFormat,
      output_format: outputFormat,
      ...options,
    },
    'export-file': {
      name: 'export-file',
      operation: 'export/url',
      input: 'convert-file',
    },
  };

  try {
    const { data } = await axios.post(
      'https://api.cloudconvert.com/v2/jobs',
      { tasks },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const jobId = data.data.id;
    
    // Simple polling for job completion
    let attempts = 0;
    while (attempts < 60) {
      const jobStatus = await axios.get(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const currentStatus = jobStatus.data.data.status;
      if (currentStatus === 'finished') {
        const exportTask = jobStatus.data.data.tasks.find((t: any) => t.name === 'export-file');
        return exportTask.result.files[0].url;
      }
      
      if (currentStatus === 'error') {
        const errorTask = jobStatus.data.data.tasks.find((t: any) => t.status === 'error');
        throw new Error(`CloudConvert error: ${errorTask?.message || 'Unknown error'}`);
      }

      await new Promise(r => setTimeout(r, 1500));
      attempts++;
    }

    throw new Error('CloudConvert job timed out');
  } catch (err: any) {
    console.error('CloudConvert API failure:', err.response?.data || err.message);
    throw err;
  }
}
