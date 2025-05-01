/**
 * Voice recording utilities using MediaRecorder API
 */

/**
 * Start recording audio from the microphone
 * @returns Promise that resolves to a MediaRecorder instance and MediaStream
 */
export const startRecording = async (): Promise<{ recorder: MediaRecorder; stream: MediaStream }> => {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    audio: true,
    video: false
  });
  
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus'
  });
  
  const audioChunks: Blob[] = [];

  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  });

  // Store audio chunks in the mediaRecorder object for later access
  (mediaRecorder as any).audioChunks = audioChunks;
  
  mediaRecorder.start(100); // Request data every 100ms for more frequent updates
  return { recorder: mediaRecorder, stream };
};

/**
 * Stop recording and return the audio blob
 * @param mediaRecorder The MediaRecorder instance
 * @returns Promise that resolves to an audio Blob
 */
export const stopRecording = (mediaRecorder: MediaRecorder): Promise<Blob> => {
  return new Promise((resolve) => {
    const audioChunks = (mediaRecorder as any).audioChunks as Blob[];
    
    const handleStop = () => {
      const audioBlob = new Blob(audioChunks, { 
        type: 'audio/webm;codecs=opus'
      });
      resolve(audioBlob);
    };

    mediaRecorder.addEventListener('stop', handleStop, { once: true });
    
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  });
};