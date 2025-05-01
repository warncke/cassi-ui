import React, { useState, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { startRecording, stopRecording } from '../../utils/voiceRecorder';
import { useTasks } from '../../providers/TaskProvider';

const RecordButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const { addTask, addTaskContext } = useTasks();

  const cleanup = () => {
    console.log('🧹 Starting cleanup...');

    // Clear timer first to stop UI updates
    if (timerRef.current) {
      console.log('⏲️ Clearing timer');
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop MediaRecorder if it exists and is recording
    if (mediaRecorderRef.current) {
      console.log('🎙️ MediaRecorder state:', mediaRecorderRef.current.state);
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          console.log('🛑 Stopping MediaRecorder');
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error('❌ Error stopping MediaRecorder:', error);
        }
      }
    }

    // Stop all tracks in the stream
    if (streamRef.current) {
      console.log('📡 Stopping media stream tracks');
      streamRef.current.getTracks().forEach(track => {
        console.log('Track state before stop:', track.readyState);
        if (track.readyState === 'live') {
          track.stop();
        }
        console.log('Track state after stop:', track.readyState);
      });
    }

    // Clear refs
    mediaRecorderRef.current = null;
    streamRef.current = null;
    
    // Reset state
    setIsRecording(false);
    setRecordingTime(0);
    startTimeRef.current = 0;
    
    console.log('✨ Cleanup completed');
  };

  const handleStartRecording = async () => {
    console.log('🎤 Starting recording...');
    if (isRecording) {
      console.log('⚠️ Already recording, ignoring start request');
      return;
    }

    try {
      console.log('🎙️ Requesting media stream...');
      const { recorder, stream } = await startRecording();
      
      console.log('✅ Got media stream and recorder');
      
      // Set up refs before starting the timer
      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      startTimeRef.current = Date.now();
      
      console.log('⏲️ Starting timer');
      // Start the timer
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 100);

      // Update recording state last
      console.log('🔴 Setting recording state to true');
      setIsRecording(true);
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      cleanup();
      alert('Could not access microphone. Please check permissions and try again.');
    }
  };

  const handleStopRecording = async () => {
    console.log('🛑 Stopping recording...');
    if (!mediaRecorderRef.current || !isRecording) {
      console.log('⚠️ No active recording to stop');
      return;
    }

    try {
      console.log('📼 Getting recorder reference');
      const recorder = mediaRecorderRef.current;
      console.log('🎙️ Stopping recorder and getting blob');
      const audioBlob = await stopRecording(recorder);
      
      console.log('📦 Got audio blob, size:', audioBlob.size);
      if (audioBlob.size > 0) {
        addTask(`Processing voice command (${Math.round(audioBlob.size / 1024)} KB)`);
      }
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
    } finally {
      console.log('🧹 Running cleanup after stop');
      cleanup();
    }
  };

  useEffect(() => {
    console.log('🔄 Setting up event listeners');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isRecording) {
        console.log('⌨️ Space key pressed');
        e.preventDefault();
        handleStartRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        console.log('⌨️ Space key released');
        e.preventDefault();
        handleStopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      console.log('🧹 Cleaning up event listeners');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'file') {
        await addTaskContext('file', {
          path: data.path,
          content: data.content
        });
      } else if (data.type === 'directory') {
        await addTaskContext('directory', {
          path: data.path
        });
      }
    } catch (error) {
      console.error('Error processing dropped item:', error);
    }
  };

  return (
    <div className="flex items-center">
      <button
        className={`flex items-center justify-center h-12 w-12 rounded-full transition-all duration-200 ${
          isDragOver
            ? 'bg-blue-600 text-white scale-110'
            : isRecording 
              ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50' 
              : 'bg-red-500 text-white hover:bg-red-600'
        }`}
        onMouseDown={handleStartRecording}
        onMouseUp={handleStopRecording}
        onTouchStart={handleStartRecording}
        onTouchEnd={handleStopRecording}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Record voice command (press and hold Space)"
      >
        <Mic size={24} />
      </button>
      
      {isRecording && (
        <div className="ml-3 flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
          <span className="text-sm font-mono">{recordingTime}s</span>
        </div>
      )}
    </div>
  );
};

export default RecordButton;